import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
	validateAuthorityRegistry,
	verifyByteRecord,
} from "./visual-authority.mjs";

const bytes = Buffer.from("approved-paper-export");

function manifest() {
	return {
		schemaVersion: 1,
		status: "IN_PROGRESS",
		acceptancePolicy: {
			captureReviewIsVerdict: false,
			baselineMayReplacePaper: false,
		},
		rejectedRoutedBaseline: { status: "SUPERSEDED_BY_ACCEPTED_CASES" },
	};
}

function deviation(status = "IMPLEMENTED_AND_REVIEWED") {
	return {
		id: "bounded-polish",
		status,
		reviewEvidence: {
			routedBefore: "before.png",
			routedAfter: "after.png",
			independentRenderedReview: "review.md",
		},
	};
}

function acceptedCase(overrides = {}) {
	return {
		id: "owner-activity-populated-en-desktop",
		status: "ACCEPTED",
		surface: "ownerActivityLog",
		route: "/admin",
		ownerSection: "activity",
		state: "populated",
		locale: "en",
		viewport: { width: 1440, height: 900 },
		comparisonMode: "paper",
		paperReference: {
			area: "OWNER ACTIVITY LOG — SHARED-SHELL SUCCESSOR — CURRENT",
			leafExportPath: "owner-activity-desktop-en-populated-1440.png",
			leafExportSha256: "paper-sha",
		},
		routedArtifact: {
			kind: "canonical",
			path: "owner-activity-desktop-en-populated-1440.png",
			sha256: "route-sha",
		},
		landmarkContracts: [
			"owner-global-shell",
			"owner-shared-navigation",
			"owner-active-panel",
		],
		approvalRecord: "approval.md",
		approvedDeviationIds: [],
		...overrides,
	};
}

function validate({
	cases = [acceptedCase()],
	canonicalArtifacts = ["owner-activity-desktop-en-populated-1440.png"],
	deviations = [],
} = {}) {
	return validateAuthorityRegistry({
		manifest: manifest(),
		cases,
		canonicalArtifacts,
		rejectedArtifacts: [],
		deviations,
	});
}

describe("full-route visual authority", () => {
	it("accepts a Paper-mapped, approved full-route artifact", () => {
		expect(() => validate()).not.toThrow();
	});

	it("rejects an unmapped canonical route state", () => {
		expect(() =>
			validate({
				canonicalArtifacts: [
					"owner-activity-desktop-en-populated-1440.png",
					"unmapped-route-state.png",
				],
			}),
		).toThrow(/lacks an authority entry/);
	});

	it("rejects a changed Paper export hash", () => {
		expect(() =>
			verifyByteRecord(
				{
					path: "paper.png",
					bytes: bytes.byteLength,
					sha256: createHash("sha256").update("different").digest("hex"),
				},
				bytes,
				"Paper export",
			),
		).toThrow(/SHA-256 changed/);
	});

	it("rejects a baseline without a human approval record", () => {
		expect(() =>
			validate({ cases: [acceptedCase({ approvalRecord: null })] }),
		).toThrow(/approvalRecord is required/);
	});

	it("rejects captureReview evidence as an acceptance verdict", () => {
		expect(() =>
			validate({
				cases: [
					acceptedCase({
						routedArtifact: {
							kind: "review",
							path: "owner-activity-desktop-en-populated-1440.png",
							sha256: "route-sha",
						},
					}),
				],
			}),
		).toThrow(/cannot be accepted from a captureReview artifact/);
	});

	it("rejects an Owner artifact missing shell or active-panel coverage", () => {
		expect(() =>
			validate({
				cases: [
					acceptedCase({
						landmarkContracts: ["owner-shared-navigation"],
					}),
				],
			}),
		).toThrow(/omits required full-route landmark/);
	});

	it("rejects unrecorded and unreviewed Paper deviations", () => {
		const withDeviation = acceptedCase({
			approvedDeviationIds: ["bounded-polish"],
		});
		expect(() => validate({ cases: [withDeviation] })).toThrow(
			/unrecorded deviation/,
		);
		expect(() =>
			validate({
				cases: [withDeviation],
				deviations: [deviation("APPROVED_PENDING_IMPLEMENTATION_EVIDENCE")],
			}),
		).toThrow(/uses unreviewed deviation/);
	});
});
