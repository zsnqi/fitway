import assert from "node:assert/strict";
import { test as nodeTest } from "node:test";
import { renderToolHelp } from "../../../scripts/agent-environment/tool-contract.mjs";
import {
	analyzeBelongingItem,
	mergeLinePieces,
} from "./belonging-geometry.mjs";
import {
	ALL_BELONGING_WIDTHS,
	belongingSegments,
	heightForBelongingWidth,
} from "./belonging-plan.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);

const fragment = (tokenId, text, left, top, right, bottom) => ({
	tokenId,
	text,
	spaceWidth: 5,
	rect: { left, top, right, bottom },
});

const item = (direction, fragments) => ({ direction, fragments });

test("RTL finds a near-side line that reaches under a two-line far column", () => {
	const result = analyzeBelongingItem(
		item("rtl", [
			fragment(1, "Peak", 0, 0, 40, 20),
			fragment(2, "Today", 100, 0, 160, 20),
			fragment(3, "79%", 0, 20, 30, 40),
			fragment(4, "No readings from 10 to 2", 10, 40, 150, 60),
		]),
	);
	assert.equal(result.columns.length, 1);
	assert.equal(result.findings.length, 1);
	assert.equal(result.findings[0].text, "No readings from 10 to 2");
	assert.equal(result.findings[0].columnText, "Peak 79%");
	assert.equal(result.findings[0].reach, 30);
});

test("LTR mirrors the two-line column and finding", () => {
	const result = analyzeBelongingItem(
		item("ltr", [
			fragment(1, "Today", 0, 0, 50, 20),
			fragment(2, "Peak", 100, 0, 140, 20),
			fragment(3, "79%", 105, 20, 140, 40),
			fragment(4, "No readings from 10 to 2", 10, 40, 130, 60),
		]),
	);
	assert.equal(result.columns.length, 1);
	assert.equal(result.findings.length, 1);
	assert.equal(result.findings[0].columnText, "Peak 79%");
	assert.equal(result.findings[0].reach, 30);
});

test("a bidi-split value within a word space is one line piece", () => {
	const pieces = mergeLinePieces(
		[fragment(1, "10:00", 0, 0, 30, 20), fragment(2, "AM", 33, 0, 50, 20)],
		"ltr",
	);
	assert.equal(pieces.length, 1);
	assert.equal(pieces[0].text, "10:00 AM");
});

test("a one-line head line is not a column", () => {
	const result = analyzeBelongingItem(
		item("rtl", [
			fragment(1, "Peak", 0, 0, 40, 20),
			fragment(2, "Today", 100, 0, 160, 20),
			fragment(3, "No readings from 10 to 2", 10, 20, 150, 40),
		]),
	);
	assert.equal(result.columns.length, 0);
	assert.equal(result.findings.length, 0);
});

test("a second stacked column line makes the near-side line a finding", () => {
	const result = analyzeBelongingItem(
		item("ltr", [
			fragment(1, "Today", 0, 0, 50, 20),
			fragment(2, "Peak", 100, 0, 140, 20),
			fragment(3, "10:44 AM", 100, 20, 140, 40),
			fragment(4, "No readings from 10 to 2", 10, 40, 130, 60),
		]),
	);
	assert.equal(result.columns.length, 1);
	assert.equal(result.findings.length, 1);
});

test("an incidental antialiasing overlap does not turn a head line into a column", () => {
	const result = analyzeBelongingItem(
		item("ltr", [
			fragment(1, "Thursday closing", 0, 0, 50, 20),
			fragment(2, "2:00 AM", 100, 0, 150, 20),
			fragment(3, "Owner", 149, 20, 169, 40),
			fragment(4, "Thursday closing moved to 2 AM", 0, 20, 110, 40),
		]),
	);
	assert.equal(result.columns.length, 0);
	assert.equal(result.findings.length, 0);
});

test("a piece reaching 1 px into the column is allowed, 1.5 px is a finding", () => {
	const onePixel = analyzeBelongingItem(
		item("ltr", [
			fragment(1, "Today", 0, 0, 50, 20),
			fragment(2, "Peak", 100, 0, 140, 20),
			fragment(3, "79%", 100, 20, 140, 40),
			fragment(4, "Note", 39, 40, 101, 60),
		]),
	);
	assert.equal(onePixel.findings.length, 0);
	const oneAndAHalfPixels = analyzeBelongingItem(
		item("ltr", [
			fragment(1, "Today", 0, 0, 50, 20),
			fragment(2, "Peak", 100, 0, 140, 20),
			fragment(3, "79%", 100, 20, 140, 40),
			fragment(4, "Note", 38.5, 40, 101.5, 60),
		]),
	);
	assert.equal(oneAndAHalfPixels.findings.length, 1);
	assert.equal(oneAndAHalfPixels.findings[0].reach, 1.5);
});

test("the default width matrix includes the exact one-pixel and fresh-load bands", () => {
	assert.equal(ALL_BELONGING_WIDTHS.length, 476);
	assert.ok(ALL_BELONGING_WIDTHS.includes(320));
	assert.ok(ALL_BELONGING_WIDTHS.includes(720));
	assert.ok(ALL_BELONGING_WIDTHS.includes(721));
	assert.ok(ALL_BELONGING_WIDTHS.includes(768));
	assert.ok(ALL_BELONGING_WIDTHS.includes(1024));
	assert.ok(ALL_BELONGING_WIDTHS.includes(1440));
	assert.equal(heightForBelongingWidth(720), 844);
	assert.equal(heightForBelongingWidth(768), 1024);
	assert.equal(heightForBelongingWidth(1440), 900);
});

test("custom widths start a fresh load when the input mode changes", () => {
	assert.deepEqual(belongingSegments([390, 800]), [[390], [800]]);
});

test("belonging-check is registered with its selection options", () => {
	const help = renderToolHelp("verify:owner", "belonging-check");
	for (const option of [
		"--concept",
		"--page",
		"--languages",
		"--widths",
		"--states",
		"--out",
	])
		assert.match(help, new RegExp(option));
});
