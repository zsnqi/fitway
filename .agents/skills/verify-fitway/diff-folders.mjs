import { resolve } from "node:path";
import { ReportedFailure } from "./core.mjs";
import { diffImages } from "./image-diff.mjs";
import { filesIn } from "./reaches.mjs";

const pngs = (root) =>
	new Map(
		filesIn(root)
			.filter(({ file }) => file.toLowerCase().endsWith(".png"))
			.map(({ file }) => [file, { path: resolve(root, file) }]),
	);

export async function diffFolders(options, { tools, child }) {
	const a = pngs(options.a);
	const b = pngs(options.b);
	const files = [...new Set([...a.keys(), ...b.keys()])].sort((left, right) =>
		left.localeCompare(right),
	);
	const counts = {
		equal: 0,
		different: 0,
		size: 0,
		"only-a": 0,
		"only-b": 0,
	};
	for (const file of files) {
		const left = a.get(file);
		const right = b.get(file);
		if (!right) {
			counts["only-a"]++;
			console.log(`ONLY-A ${file}`);
			continue;
		}
		if (!left) {
			counts["only-b"]++;
			console.log(`ONLY-B ${file}`);
			continue;
		}
		const measurement = await diffImages(left.path, right.path, {
			out: options.out,
			prefix: `diffs/${file.replace(/\.png$/i, "")}`,
			tools,
			child,
		});
		if (measurement.sameSize === false) {
			counts.size++;
			console.log(
				`SIZE ${file}; a ${measurement.sizeA.join("x")}; b ${measurement.sizeB.join("x")}`,
			);
		} else if (measurement.identical) {
			counts.equal++;
			console.log(`EQUAL ${file}`);
		} else {
			counts.different++;
			console.log(
				`DIFFERENT ${file}; region ${JSON.stringify(measurement.bbox)}; changed pixels ${measurement.changedPixels}`,
			);
		}
	}
	console.log(
		`DIFF-FOLDERS SUMMARY: ${counts.equal} equal; ${counts.different} different; ${counts.size} size; ${counts["only-a"]} only-a; ${counts["only-b"]} only-b`,
	);
	if (counts.different || counts.size || counts["only-a"] || counts["only-b"]) {
		throw new ReportedFailure(
			"PNG folders differ; inspect the lines and diff artifacts.",
		);
	}
	return { files: files.length, ...counts };
}
