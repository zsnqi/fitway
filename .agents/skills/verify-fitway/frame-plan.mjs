// Plan recipe-free public frames from drive's page, state, size and context model.
import { safe } from "./capture-records.mjs";
import { colorsAxis } from "./colors.mjs";
import { axis, stateCases } from "./drive-plan.mjs";
import { parseFrameActions } from "./frame-actions.mjs";

const frameForm =
	"use <size>, <size>@<density>, <width>x<height> or <width>x<height>@<density>, with whole CSS pixels (width 240-3840, height 240-2400) and density 1-4";

function freeDimensions(name, token) {
	const match = /^(\d+)x(\d+)$/i.exec(name);
	if (!match) {
		if (/x/i.test(name))
			throw new Error(`Invalid free frame size ${token}; ${frameForm}`);
		return null;
	}
	const width = Number(match[1]);
	const height = Number(match[2]);
	if (width < 240 || width > 3840 || height < 240 || height > 2400)
		throw new Error(
			`Frame size ${token} is outside the free-size bounds; ${frameForm}`,
		);
	return { width, height };
}

function viewportKey(dimensions) {
	const zoom = dimensions.zoom || 1;
	return `${dimensions.width / zoom}x${dimensions.height / zoom}`;
}

export function parseFrameSizes(value, sizes) {
	const names = Object.keys(sizes);
	const seen = new Set();
	const dimensionsSeen = new Map();
	const parsed = String(value || "")
		.split(",")
		.filter((part) => part !== "")
		.map((token) => {
			const parts = token.split("@");
			if (parts.length > 2)
				throw new Error(`Invalid frame size ${token}; ${frameForm}`);
			const name = parts[0];
			if (!name) throw new Error(`Invalid frame size ${token}; ${frameForm}`);
			const free = freeDimensions(name, token);
			if (!sizes[name] && !free)
				throw new Error(
					`Unknown frame size ${name} in ${token}; choose ${names.join(", ")}`,
				);
			const canonicalName = free ? `${free.width}x${free.height}` : name;
			if (seen.has(canonicalName))
				throw new Error(
					`Duplicate frame size ${canonicalName} in ${value}; ${frameForm}; use each size once`,
				);
			seen.add(canonicalName);
			const dimensions = free || sizes[name];
			const key = viewportKey(dimensions);
			const duplicate = dimensionsSeen.get(key);
			if (duplicate)
				throw new Error(
					`Duplicate frame size dimensions ${key} in ${value} (${duplicate} and ${token}); ${frameForm}; use each size once`,
				);
			dimensionsSeen.set(key, token);
			const rawDensity = parts[1];
			if (parts.length === 2 && !/^[1-4]$/.test(rawDensity))
				throw new Error(`Invalid frame size ${token}; ${frameForm}`);
			return {
				name: canonicalName,
				density: rawDensity === undefined ? 1 : Number(rawDensity),
				dimensions,
			};
		});
	if (!parsed.length) throw new Error(`Missing frame sizes; ${frameForm}`);
	return parsed;
}

// A name carries an axis value exactly when that axis has more than one value for the frame's size.
function suffix(name, values) {
	return values.length > 1 ? `-${safe(name)}` : "";
}

// Without --inputs the input axis is null here: stateFrames gives each size its one input.
function frameAxes(options) {
	return {
		inputs:
			options.inputs === undefined
				? null
				: axis(options.inputs, "", ["mouse", "touch", "keyboard"]),
		motions: axis(options.motions, "reduce", ["reduce", "full"]),
		transports: axis(options.transports, "http", ["http", "file"]),
		colors: colorsAxis(options.colors),
	};
}

function frameName(
	{ language, size, state, input, motion, transport, color },
	axes,
) {
	return (
		[language, size.name, safe(state.name)].join("-") +
		suffix(input, axes.inputs) +
		suffix(motion, axes.motions) +
		suffix(transport, axes.transports) +
		suffix(color, axes.colors) +
		".png"
	);
}

function stateFrames(state, language, size, axes) {
	const { dimensions, density } = size;
	const zoom = dimensions.zoom || 1;
	const cssWidth = dimensions.width / zoom;
	const cssHeight = dimensions.height / zoom;
	const sizeAxes = {
		...axes,
		inputs: axes.inputs || [cssWidth <= 720 ? "touch" : "mouse"],
	};
	const frames = [];
	for (const input of sizeAxes.inputs)
		for (const motion of axes.motions)
			for (const transport of axes.transports)
				for (const color of axes.colors)
					frames.push({
						file: frameName(
							{
								language,
								size,
								state,
								input,
								motion,
								transport,
								color,
							},
							sizeAxes,
						),
						state: state.name,
						query: {
							...state.query,
							lang: language,
							...(motion === "reduce" ? { motion: "off" } : {}),
						},
						language,
						size: size.name,
						cssWidth,
						cssHeight,
						density,
						pngWidth: dimensions.width * density,
						pngHeight: dimensions.height * density,
						input,
						motion,
						transport,
						colours: color,
					});
	return frames;
}

function uniqueFrames(frames) {
	const names = new Set();
	for (const frame of frames) {
		if (names.has(frame.file))
			throw new Error(
				`Frame name collision ${frame.file}; change the query states to distinct values`,
			);
		names.add(frame.file);
	}
	return frames;
}

export function framePlan(map, options) {
	const selected = map.pages.find(
		(page) => page.page === (options.page || "index.html"),
	);
	if (!selected) throw new Error(`Unmapped page: ${options.page}`);
	const languages = axis(options.languages, "ar,en", ["ar", "en"]);
	if (!options.sizes)
		throw new Error(
			"Missing --sizes; use a comma list of <size> or <size>@<density>",
		);
	const sizes = parseFrameSizes(options.sizes, map.sizes);
	const axes = frameAxes(options);
	const cases = stateCases(selected, options);
	const capture = {
		...(options.actions === undefined
			? {}
			: { actions: parseFrameActions(options.actions) }),
		...(options.clip === undefined ? {} : { clip: options.clip }),
	};
	const frames = uniqueFrames(
		cases.flatMap((state) =>
			languages.flatMap((language) =>
				sizes.flatMap((size) => stateFrames(state, language, size, axes)),
			),
		),
	).map((frame) => ({ ...frame, ...capture }));
	return { selected, languages, sizes, cases, frames };
}
