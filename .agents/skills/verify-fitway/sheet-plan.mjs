// Parse sheet rows and derive the CSS size of each frame from its capture density.
import { basename, dirname, resolve } from "node:path";

export function parseSheetRows(tokens) {
	const rows = [[]];
	for (const token of tokens) {
		if (/^--row$/.test(token)) {
			if (!rows.at(-1).length)
				throw new Error(
					"Empty sheet row; put at least one <label>=<png> after each --row",
				);
			rows.push([]);
			continue;
		}
		if (!token.includes("="))
			throw new Error(`Invalid sheet frame ${token}; use <label>=<png>`);
		const split = token.indexOf("=");
		const label = token.slice(0, split);
		const path = token.slice(split + 1);
		if (!label)
			throw new Error(`Empty sheet label in ${token}; use <label>=<png>`);
		if (!path)
			throw new Error(`Missing sheet PNG in ${token}; use <label>=<png>`);
		rows.at(-1).push({ label, path: resolve(path) });
	}
	if (!rows[0].length)
		throw new Error("No sheet frames; put <label>=<png> after --");
	if (!rows.at(-1).length)
		throw new Error(
			"Empty sheet row; put at least one <label>=<png> after each --row",
		);
	return rows;
}

export function manifestDensity(manifest, file) {
	if (!manifest || !Array.isArray(manifest.items)) return 1;
	const absolute = resolve(file);
	const item = manifest.items.find(
		(entry) =>
			entry &&
			Number.isInteger(entry.density) &&
			entry.density > 0 &&
			(entry.file === basename(absolute) ||
				resolve(dirname(absolute), entry.file || "") === absolute),
	);
	return item?.density || 1;
}

export function frameLayout({ label, path, pngWidth, pngHeight, density }) {
	if (!label) throw new Error(`Empty sheet label for ${path}`);
	if (!Number.isInteger(pngWidth) || pngWidth <= 0)
		throw new Error(`Invalid PNG width ${pngWidth} for ${path}`);
	if (!Number.isInteger(pngHeight) || pngHeight <= 0)
		throw new Error(`Invalid PNG height ${pngHeight} for ${path}`);
	if (!Number.isInteger(density) || density <= 0)
		throw new Error(`Invalid density ${density} for ${path}`);
	return {
		label,
		path,
		pngWidth,
		pngHeight,
		density,
		drawnWidth: pngWidth / density,
		drawnHeight: pngHeight / density,
	};
}
