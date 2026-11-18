// Name and match comparison items across the build and baseline sides.

// A cross-side diff runs as (baseline, build); diff_map names their sizes A and B.
export const crossSizes = (measurement) =>
	measurement.sameSize === false
		? { baseline: measurement.sizeA, build: measurement.sizeB }
		: undefined;
export const sizesText = (sizes) =>
	sizes
		? `; sizes baseline ${sizes.baseline.join("x")}, build ${sizes.build.join("x")}`
		: "";
export const identity = (item) =>
	JSON.stringify([
		item.feature,
		item.state,
		item.language,
		item.size,
		item.input,
		item.motion,
		item.transport,
		item.colors,
	]);
export const diffStem = (item, index = 0) =>
	`${String(index + 1).padStart(3, "0")}-${[
		item.feature,
		item.state,
		item.language,
		item.size,
		item.input,
		item.motion,
		item.transport,
		...(item.colors === "forced" ? ["forced"] : []),
	]
		.map((value) =>
			String(value)
				.replace(/[^\w-]/g, "-")
				.slice(0, 100),
		)
		.join("-")}`;
