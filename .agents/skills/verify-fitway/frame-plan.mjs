// Plan recipe-free public frames from drive's page, state, size and context model.
import { safe } from "./capture-records.mjs";
import { colorsAxis } from "./colors.mjs";
import { axis, stateCases } from "./drive-plan.mjs";

const frameForm =
	"use <size> or <size>@<density> with a whole density from 1 to 4";

export function parseFrameSizes(value, sizes) {
	const names = Object.keys(sizes);
	const seen = new Set();
	const parsed = String(value || "")
		.split(",")
		.filter((part) => part !== "")
		.map((token) => {
			const parts = token.split("@");
			if (parts.length > 2)
				throw new Error(`Invalid frame size ${token}; ${frameForm}`);
			const name = parts[0];
			if (!name) throw new Error(`Invalid frame size ${token}; ${frameForm}`);
			if (!sizes[name])
				throw new Error(
					`Unknown frame size ${name} in ${token}; choose ${names.join(", ")}`,
				);
			if (seen.has(name))
				throw new Error(
					`Duplicate frame size ${name} in ${value}; ${frameForm}; use each size once`,
				);
			seen.add(name);
			const rawDensity = parts[1];
			if (parts.length === 2 && !/^[1-4]$/.test(rawDensity))
				throw new Error(`Invalid frame size ${token}; ${frameForm}`);
			return {
				name,
				density: rawDensity === undefined ? 1 : Number(rawDensity),
				dimensions: sizes[name],
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
	const frames = uniqueFrames(
		cases.flatMap((state) =>
			languages.flatMap((language) =>
				sizes.flatMap((size) => stateFrames(state, language, size, axes)),
			),
		),
	);
	return { selected, languages, sizes, cases, frames };
}
