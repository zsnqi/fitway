import { createHash } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { outputFile } from "./core.mjs";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

const validSize = (size) =>
	Array.isArray(size) &&
	size.length === 2 &&
	size.every((value) => Number.isSafeInteger(value) && value > 0);

export async function diffImages(a, b, { out, prefix, tools, child }) {
	if (digest(await readFile(a)) === digest(await readFile(b)))
		return { identical: true, bbox: null, changedPixels: 0 };
	const json = await outputFile(out, `${prefix}.json`);
	await rm(json, { force: true });
	try {
		await child(
			process.platform === "win32" ? "py" : "python3",
			[
				resolve(tools, "scripts/img/diff_map.py"),
				a,
				b,
				"--out",
				await outputFile(out, prefix),
				"--json",
				json,
			],
			undefined,
			undefined,
			true,
		);
	} catch (error) {
		const measurement = await readFile(json, "utf8")
			.then(JSON.parse)
			.catch(() => null);
		if (
			measurement?.tool === "diff_map" &&
			measurement.a === a &&
			measurement.b === b &&
			measurement.sameSize === false &&
			measurement.ok === false &&
			validSize(measurement.sizeA) &&
			validSize(measurement.sizeB) &&
			measurement.sizeA.some(
				(value, index) => value !== measurement.sizeB[index],
			)
		)
			return { ...measurement, identical: false };
		throw error;
	}
	return JSON.parse(await readFile(json, "utf8"));
}
