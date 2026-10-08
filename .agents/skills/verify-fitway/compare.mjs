import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
	assertOutsideGit,
	jsonOutput,
	outputFile,
	portAvailable,
	ReportedFailure,
	shortFinding,
	verificationPort,
} from "./core.mjs";
import { drive } from "./runner.mjs";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const identity = (item) =>
	JSON.stringify([
		item.feature,
		item.state,
		item.language,
		item.size,
		item.input,
		item.motion,
		item.transport,
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
	]
		.map((value) =>
			String(value)
				.replace(/[^\w-]/g, "-")
				.slice(0, 100),
		)
		.join("-")}`;
async function capture(options, setup, out) {
	try {
		return await drive({
			...options,
			...setup,
			session: undefined,
			out,
			quiet: true,
		});
	} catch (error) {
		try {
			return {
				...JSON.parse(await readFile(resolve(out, "manifest.json"), "utf8")),
				error: error.message,
			};
		} catch {
			throw error;
		}
	}
}

export async function compare(options, { doctor, child }) {
	const out = options.out;
	assertOutsideGit(out);
	const ports = [
		verificationPort(options.port || 3176),
		verificationPort(options["baseline-port"] || 3177),
	];
	for (const port of ports) await portAvailable(port);
	if (options.session)
		throw new Error("compare owns its previews; omit --session.");
	if (!options.baseline)
		throw new Error("compare requires --baseline <absolute concept folder>.");
	const build = await doctor({
		...options,
		port: ports[0],
		tools: "diff",
		quiet: true,
	});
	const baseline = await doctor({
		...options,
		concept: options.baseline,
		map: options["baseline-map"],
		recipes: options["baseline-recipes"] || options.recipes,
		port: ports[1],
		tools: "diff",
		quiet: true,
	});
	const pages =
		options.page === "all"
			? build.map.pages.map((p) => p.page)
			: [options.page || "index.html"];
	const result = {
		schema: 1,
		concept: build.concept,
		baseline: baseline.concept,
		items: [],
	};
	const diff = async (a, b, prefix) => {
		if (digest(await readFile(a)) === digest(await readFile(b)))
			return { identical: true, bbox: null, changedPixels: 0 };
		const json = await outputFile(out, `${prefix}.json`);
		await child(
			process.platform === "win32" ? "py" : "python3",
			[
				resolve(build.tools, "scripts/img/diff_map.py"),
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
		return JSON.parse(await readFile(json, "utf8"));
	};
	for (const page of pages) {
		const tag = page.replace(".html", "");
		const folders = {
			build: resolve(out, tag, "build"),
			baseline: resolve(out, tag, "baseline"),
		};
		const left = await capture(
			{ ...options, page, port: ports[0] },
			build,
			folders.build,
		);
		const right = await capture(
			{ ...options, page, port: ports[1] },
			baseline,
			folders.baseline,
		);
		if (!left.items.length || !right.items.length)
			throw new Error(
				`Comparison captured no items: build=${left.error || left.items.length}; baseline=${right.error || right.items.length}`,
			);
		for (const [index, item] of left.items.entries()) {
			const other = right.items.find((i) => identity(i) === identity(item));
			const entry = {
				feature: item.feature,
				state: item.state,
				language: item.language,
				size: item.size,
				input: item.input,
				motion: item.motion,
				transport: item.transport,
				result: "problem",
				problems: [],
				files: {
					build: resolve(folders.build, item.files.at(-1) || ""),
					baseline: resolve(folders.baseline, other?.files.at(-1) || ""),
				},
			};
			result.items.push(entry);
			try {
				if (!other) throw new Error("Baseline has no matching item");
				if (
					item.status === "not-reachable" &&
					other.status === "not-reachable"
				) {
					entry.result = "not-reachable";
					entry.problems.push(...item.problems, ...other.problems);
				} else {
					if (item.status !== "pass" || other.status !== "pass")
						throw new Error(
							`Capture problem: build=${item.status}, baseline=${other.status}; ${[...item.problems, ...other.problems].join("; ")}`,
						);
					const prefix = diffStem(item, index);
					let measured = await diff(
						entry.files.baseline,
						entry.files.build,
						`${prefix}-initial-diff`,
					);
					entry.initial = {
						identical: measured.identical,
						region: measured.bbox,
						changedPixels: measured.changedPixels,
					};
					if (!measured.identical) {
						const repeatOptions = {
							...options,
							page,
							feature: item.feature.split("/")[1],
							states: "default",
							query: new URLSearchParams(
								Object.entries(item.query).filter(
									([key]) => !["lang", "motion"].includes(key),
								),
							).toString(),
							languages: item.language,
							sizes: item.size,
							inputs: item.input,
							motions: item.motion,
							transports: item.transport,
						};
						const repeatedBuild = await capture(
							{ ...repeatOptions, port: ports[0] },
							build,
							resolve(out, `${prefix}-repeat-build`),
						);
						const repeatedBase = await capture(
							{ ...repeatOptions, port: ports[1] },
							baseline,
							resolve(out, `${prefix}-repeat-baseline`),
						);
						const b = repeatedBuild.items[0];
						const a = repeatedBase.items[0];
						if (b?.status !== "pass" || a?.status !== "pass")
							throw new Error("Fresh-context repetition had a capture problem");
						entry.repeated = true;
						entry.files.repeatBuild = resolve(
							out,
							`${prefix}-repeat-build`,
							b.files.at(-1),
						);
						entry.files.repeatBaseline = resolve(
							out,
							`${prefix}-repeat-baseline`,
							a.files.at(-1),
						);
						measured = await diff(
							entry.files.repeatBaseline,
							entry.files.repeatBuild,
							`${prefix}-diff`,
						);
						entry.diffPrefix = resolve(out, `${prefix}-diff`);
					}
					entry.result = measured.identical ? "equal" : "different";
					entry.region = measured.bbox;
					entry.changedPixels = measured.changedPixels;
					entry.diffImages = measured.images;
				}
			} catch (error) {
				entry.problems.push(error.message);
			}
			console.log(
				`COMPARE ${entry.result.toUpperCase()}: ${entry.feature} ${entry.state} ${entry.language} ${entry.size} ${entry.input} ${entry.motion} ${entry.transport}${entry.region ? `; region ${JSON.stringify(entry.region)}; diff ${entry.diffPrefix}` : ""}${entry.repeated ? "; repeated in fresh contexts" : ""}${entry.problems.length ? `; ${entry.problems.map(shortFinding).join("; ")}` : ""}`,
			);
			await jsonOutput(out, "comparison.json", result);
		}
		for (const item of right.items)
			if (!left.items.some((other) => identity(item) === identity(other))) {
				const entry = {
					feature: item.feature,
					state: item.state,
					language: item.language,
					size: item.size,
					input: item.input,
					motion: item.motion,
					transport: item.transport,
					result: "problem",
					problems: ["Baseline-only item; no matching build item"],
				};
				result.items.push(entry);
				console.log(
					`COMPARE PROBLEM: ${entry.feature} ${entry.state}; ${entry.problems[0]}`,
				);
			}
	}
	await jsonOutput(out, "comparison.json", result);
	const counts = Object.fromEntries(
		["equal", "different", "not-reachable", "problem"].map((key) => [
			key,
			result.items.filter((i) => i.result === key).length,
		]),
	);
	console.log(
		`COMPARE ${counts.different || counts.problem ? "FAIL" : "PASS"}: ${counts.equal} equal; ${counts.different} different; ${counts["not-reachable"]} not reachable; ${counts.problem} problems; ${out}/comparison.json`,
	);
	if (counts.different || counts.problem)
		throw new ReportedFailure(
			"Comparison has differences or problems; inspect comparison.json.",
		);
	return result;
}
