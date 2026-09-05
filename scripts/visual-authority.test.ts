import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
	validateAuthorityRegistry,
	verifyByteRecord,
	verifyShaRecord,
} from "./visual-authority.mjs";

const bytes = Buffer.from("approved-paper-export");

function manifest(overrides = {}) {
	return {
		schemaVersion: 1,
		status: "IN_PROGRESS",
		surfaces: {
			ownerActivityLog: {
				area: "OWNER ACTIVITY LOG — SHARED-SHELL SUCCESSOR — CURRENT",
				leafExports: [
					{
						path: "owner-activity-desktop-en-populated-1440.png",
						sha256: "paper-sha",
					},
				],
			},
		},
		acceptancePolicy: {
			captureReviewIsVerdict: false,
			baselineMayReplacePaper: false,
		},
		rejectedRoutedBaseline: { status: "SUPERSEDED_BY_ACCEPTED_CASES" },
		...overrides,
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
	requiredCoverage = [],
	manifestOverrides = {},
	availableEvidencePaths = [
		"approval.md",
		"review.md",
		"before.png",
		"after.png",
	],
} = {}) {
	return validateAuthorityRegistry({
		manifest: manifest(manifestOverrides),
		availableEvidencePaths,
		cases,
		canonicalArtifacts,
		rejectedArtifacts: [],
		deviations,
		requiredCoverage,
	});
}

describe("full-route visual authority", () => {
	it("accepts a Paper-mapped, approved full-route artifact", () => {
		expect(() => validate()).not.toThrow();
	});

	it("supports the durable final authority status", () => {
		expect(() =>
			validate({ manifestOverrides: { status: "ACCEPTED_CURRENT" } }),
		).not.toThrow();
	});

	it("rejects final authority with planned cases", () => {
		expect(() =>
			validate({
				cases: [acceptedCase({ status: "PLANNED" })],
				manifestOverrides: { status: "ACCEPTED_CURRENT" },
			}),
		).toThrow(/requires every registered case/);
	});
	it("rejects unsupported modes and unregistered Paper identity", () => {
		expect(() =>
			validate({ cases: [acceptedCase({ comparisonMode: "anything" })] }),
		).toThrow(/unsupported comparison/);
		expect(() =>
			validate({
				cases: [
					acceptedCase({
						paperReference: { ...acceptedCase().paperReference, area: "wrong" },
					}),
				],
			}),
		).toThrow(/unregistered Paper family/);
		for (const change of [
			{ leafExportPath: "missing.png" },
			{ leafExportSha256: "wrong" },
		]) {
			expect(() =>
				validate({
					cases: [
						acceptedCase({
							paperReference: { ...acceptedCase().paperReference, ...change },
						}),
					],
				}),
			).toThrow(/unregistered Paper export/);
		}
	});
	it("rejects unresolved approval and deviation evidence", () => {
		expect(() => validate({ availableEvidencePaths: [] })).toThrow(
			/approvalRecord.*unresolved/,
		);
		expect(() =>
			validate({
				cases: [acceptedCase({ approvedDeviationIds: ["bounded-polish"] })],
				deviations: [
					{
						...deviation(),
						reviewEvidence: {
							...deviation().reviewEvidence,
							independentRenderedReview: "PENDING_FINAL_MILESTONE_REVIEW",
						},
					},
				],
			}),
		).toThrow(/unresolved evidence/);
	});
	it("requires reviewed runtime evidence without inventing an exact Paper leaf", () => {
		const runtime = acceptedCase({
			comparisonMode: "runtime-interpolation",
			paperReference: { area: acceptedCase().paperReference.area },
			runtimeReviewRecord: "review.md",
		});
		expect(() => validate({ cases: [runtime] })).not.toThrow();
		expect(() =>
			validate({ cases: [{ ...runtime, runtimeReviewRecord: null }] }),
		).toThrow(/runtimeReviewRecord.*unresolved/);
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

	it("rejects a changed accepted routed artifact hash", () => {
		expect(() =>
			verifyShaRecord(
				{
					path: "route.png",
					sha256: createHash("sha256").update("different").digest("hex"),
				},
				bytes,
				"Accepted routed artifact",
			),
		).toThrow(/SHA-256 changed/);
	});

	it("rejects missing required Paper-covered viewport or state cases", () => {
		expect(() =>
			validate({
				requiredCoverage: [
					{
						surface: "ownerActivityLog",
						state: "populated",
						viewports: [{ width: 768, height: 1024 }],
					},
				],
			}),
		).toThrow(/Required route visual coverage is missing/);
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
