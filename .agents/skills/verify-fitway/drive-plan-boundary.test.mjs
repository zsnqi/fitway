import assert from "node:assert/strict";
import test from "node:test";
import {
	contextOptions,
	drivePlan,
	featureUnreachable,
	plannedCaptures,
} from "./drive-plan.mjs";
import { VIEWPORT_SIZES } from "./map.mjs";

const phone = { widths: "phone" };
const wide = { widths: "wide" };

test("phone and wide recipes share the page's 720 CSS-pixel boundary under zoom", () => {
	for (const { width, zoom, cssWidth } of [
		{ width: 720, zoom: 1, cssWidth: 720 },
		{ width: 1440, zoom: 2, cssWidth: 720 },
	]) {
		assert.equal(
			featureUnreachable(phone, cssWidth, {}, "en"),
			null,
			`phone feature at ${cssWidth} CSS px (${width} px at zoom ${zoom})`,
		);
		assert.notEqual(
			featureUnreachable(wide, cssWidth, {}, "en"),
			null,
			`wide feature at ${cssWidth} CSS px (${width} px at zoom ${zoom})`,
		);
	}

	for (const { width, zoom, cssWidth } of [
		{ width: 721, zoom: 1, cssWidth: 721 },
		{ width: 1441, zoom: 2, cssWidth: 720.5 },
		{ width: 1442, zoom: 2, cssWidth: 721 },
	]) {
		assert.notEqual(
			featureUnreachable(phone, cssWidth, {}, "en"),
			null,
			`phone feature above 720 CSS px (${width} px at zoom ${zoom})`,
		);
		assert.equal(
			featureUnreachable(wide, cssWidth, {}, "en"),
			null,
			`wide feature above 720 CSS px (${width} px at zoom ${zoom})`,
		);
	}
});

test("a touch context is mobile only at 720 CSS pixels or less", () => {
	for (const { width, zoom, cssWidth } of [
		{ width: 720, zoom: 1, cssWidth: 720 },
		{ width: 721, zoom: 1, cssWidth: 721 },
		{ width: 1440, zoom: 2, cssWidth: 720 },
		{ width: 1441, zoom: 2, cssWidth: 720.5 },
		{ width: 1442, zoom: 2, cssWidth: 721 },
	]) {
		assert.equal(
			contextOptions({
				width,
				height: 900,
				zoom,
				input: "touch",
				motion: "reduce",
				color: "normal",
				language: "en",
			}).mobile,
			cssWidth <= 720,
			`touch context at ${cssWidth} CSS px (${width} px at zoom ${zoom})`,
		);
		assert.equal(
			contextOptions({
				width,
				height: 900,
				zoom,
				input: "mouse",
				motion: "reduce",
				color: "normal",
				language: "en",
			}).mobile,
			false,
		);
	}
});

test("phone360 is a named drive size at 360 by 780 CSS pixels", () => {
	const map = {
		sizes: VIEWPORT_SIZES,
		pages: [
			{
				page: "index.html",
				ready: "window.__ready === true",
				defaults: {},
				switches: [],
				states: [],
				features: [
					{
						id: "page",
						query: {},
						proof: { ready: true },
						actions: [],
					},
				],
			},
		],
	};
	assert.deepEqual(map.sizes.phone360, { width: 360, height: 780 });
	assert.equal(Object.keys(map.sizes).length, 7);
	const planned = plannedCaptures(map, {
		page: "index.html",
		feature: "page",
		languages: "en",
		sizes: "phone360",
		inputs: "touch",
		motions: "reduce",
		transports: "http",
		colors: "normal",
		states: "default",
	});
	assert.equal(planned.items.length, 1);
	assert.equal(planned.items[0].size, "phone360");
	assert.deepEqual(
		drivePlan(map, {
			page: "index.html",
			feature: "page",
			languages: "en",
			sizes: "phone360",
			states: "default",
		}).sizes,
		["phone360"],
	);
});
