import {
	mkdir,
	readdir,
	readFile,
	rename,
	stat,
	writeFile,
} from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cacheLock, removeCacheFolder } from "./cache-lock.mjs";
import { assertOutsideGit, inside, outputFile } from "./core.mjs";
import { filesIn, hash } from "./reaches.mjs";

export const cacheRoot = "D:/fitway-verify-captures";
export const cacheLimit = 10 * 1024 ** 3;
const self = dirname(fileURLToPath(import.meta.url));
const stableFiles = (root) =>
	filesIn(root).filter(
		({ file }) =>
			!/(?:^|[\\/])__pycache__(?:[\\/]|$)/.test(file) && !/\.pyc$/i.test(file),
	);

export const captureIdentity = (item) =>
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

export function sharedTimes(left, right) {
	return Object.fromEntries(
		left.items.map((item) => {
			const other = right.items.find(
				(i) => captureIdentity(i) === captureIdentity(item),
			);
			return [
				captureIdentity(item),
				[
					...new Set([
						...(item.timeline?.times || []),
						...(other?.timeline?.times || []),
					]),
				].sort((a, b) => a - b),
			];
		}),
	);
}

export function absoluteCaptures(manifest, folder) {
	const copy = structuredClone(manifest);
	for (const item of copy.items) {
		item.files = item.files.map((file) => resolve(folder, file));
		for (const sample of item.timeline?.samples || [])
			sample.file = resolve(folder, sample.file);
	}
	copy.sheets = (copy.sheets || []).map((file) => resolve(folder, file));
	return copy;
}

export function mergeCaptures(order, ...manifests) {
	const items = manifests.flatMap((manifest) => manifest?.items || []);
	return {
		...(manifests.find(Boolean) || {}),
		sheets: [],
		items: order.items.flatMap((item) => {
			const index = items.findIndex(
				(candidate) => captureIdentity(candidate) === captureIdentity(item),
			);
			const found = index < 0 ? null : items.splice(index, 1)[0];
			return found ? [found] : [];
		}),
	};
}

const itemBundle = (bundle, item) => {
	const only = (manifest) =>
		manifest ? mergeCaptures({ items: [item] }, manifest) : null;
	return {
		original: only(bundle.original),
		effective: only(bundle.effective),
		settled: only(bundle.settled),
		reserves: bundle.reserves.map(only),
		times: bundle.times
			? { [captureIdentity(item)]: bundle.times[captureIdentity(item)] }
			: undefined,
	};
};

const transform = (value, fn) => {
	if (typeof value === "string") return fn(value);
	if (Array.isArray(value)) return value.map((item) => transform(item, fn));
	if (value && typeof value === "object")
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, transform(item, fn)]),
		);
	return value;
};

// Entries own copies, never references into an old run. Publication is atomic;
// all artifact bytes are checked before reuse, and eviction is oldest-first.
export class BaselineCache {
	constructor(setup, options, loads) {
		this.setup = setup;
		this.options = options;
		this.loads = loads;
		this.root = cacheRoot;
	}
	async initialize() {
		assertOutsideGit(this.root);
		await mkdir(this.root, { recursive: true });
		const tooling = [
			...filesIn(self).filter(
				(f) => f.file.endsWith(".mjs") && !f.file.endsWith(".test.mjs"),
			),
			...filesIn(resolve(self, "../gardener")).filter((f) =>
				f.file.startsWith("code-health"),
			),
		].map((f) => [f.file, hash(f.bytes)]);
		const captureTools = stableFiles(this.setup.tools).map((f) => [
			f.file,
			hash(f.bytes),
		]);
		const executableFolder = dirname(
			this.setup.loaded.pw.chromium.executablePath(),
		);
		const browserFolder = dirname(executableFolder);
		const revision = /^chromium-(\d+)$/.exec(basename(browserFolder))?.[1];
		const executableIdentity = (root, target) => {
			const match = filesIn(root).find(
				(file) => resolve(root, file.file) === resolve(target),
			);
			if (!match) throw new Error(`Browser executable missing: ${target}`);
			return [target, hash(match.bytes)];
		};
		// Playwright's headed path is public, but headless comparisons use
		// the separately installed shell of the same Chromium revision.
		// Hash the two build binaries rather than generated files beside them.
		const browser = [
			executableIdentity(
				executableFolder,
				this.setup.loaded.pw.chromium.executablePath(),
			),
			...(revision
				? [
						(() => {
							const root = resolve(
								dirname(browserFolder),
								`chromium_headless_shell-${revision}`,
							);
							return executableIdentity(
								root,
								resolve(
									root,
									"chrome-headless-shell-win64",
									"chrome-headless-shell.exe",
								),
							);
						})(),
					]
				: []),
		];
		const probes = filesIn(resolve(this.setup.concept, "tools/probes")).map(
			(f) => [f.file, hash(f.bytes)],
		);
		this.environment = hash(
			JSON.stringify([
				tooling,
				captureTools,
				browser,
				probes,
				this.setup.loaded.version,
				this.setup.map.sizes,
			]),
		);
	}
	key(page, item) {
		const settings = {};
		for (const name of ["cache", "probes", "timeline", "timeline-times"])
			settings[name] = this.options[name];
		for (const [name, value] of Object.entries({
			feature: item.feature,
			state: item.state,
			query: Object.fromEntries(Object.entries(item.query).sort()),
			language: item.language,
			size: item.size,
			input: item.input,
			motion: item.motion,
			transport: item.transport,
			colors: item.colors,
		}))
			settings[name] = value;
		const load = this.loads.find((p) => p.page === page);
		return hash(
			JSON.stringify([
				this.environment,
				page,
				load.fingerprint,
				settings,
				item.transport === "file" ? this.setup.concept : null,
			]),
		);
	}
	async load(page, left, out) {
		const release = await cacheLock(this.root);
		try {
			const bundles = [];
			for (const [index, item] of left.items.entries()) {
				const bundle = await this.loadItem(
					page,
					{ items: [item] },
					resolve(out, String(index)),
				);
				if (bundle) bundles.push(bundle);
			}
			if (!bundles.length) return null;
			return {
				original: mergeCaptures(
					left,
					...bundles.map((bundle) => bundle.original),
				),
				effective: mergeCaptures(
					left,
					...bundles.map((bundle) => bundle.effective),
				),
				settled: mergeCaptures(
					left,
					...bundles.map((bundle) => bundle.settled),
				),
				reserves: bundles[0].reserves.map((_, index) =>
					mergeCaptures(
						left,
						...bundles.map((bundle) => bundle.reserves[index]),
					),
				),
				times: Object.assign({}, ...bundles.map((bundle) => bundle.times)),
			};
		} finally {
			await release();
		}
	}
	async loadItem(page, left, out) {
		if (this.loads.find((p) => p.page === page)?.external) return null;
		const key = this.key(page, left.items[0]);
		const folder = resolve(this.root, key);
		try {
			const entry = JSON.parse(
				await readFile(resolve(folder, "entry.json"), "utf8"),
			);
			if (entry.schema !== 2 || entry.key !== key) return null;
			if (
				this.options.timeline &&
				this.options["timeline-times"] === undefined &&
				JSON.stringify(sharedTimes(left, entry.bundle.original)) !==
					JSON.stringify(entry.bundle.times)
			)
				return null;
			const replacements = new Map();
			for (const artifact of entry.artifacts) {
				if (!/^asset-\d+\.png$/.test(artifact.name)) return null;
				const bytes = await readFile(resolve(folder, artifact.name));
				if (hash(bytes) !== artifact.digest) return null;
				const file = await outputFile(out, artifact.name);
				await writeFile(file, bytes);
				replacements.set(`vf-cache:${artifact.name}`, file);
			}
			return transform(
				entry.bundle,
				(value) =>
					replacements.get(value) ||
					value.replaceAll(entry.concept, this.setup.concept),
			);
		} catch (error) {
			if (
				!["ENOENT", "ENOTDIR", "SyntaxError"].includes(error.code || error.name)
			)
				console.log(`BASELINE CACHE MISS: ${error.message}`);
			return null;
		}
	}
	async save(page, bundle, out) {
		const release = await cacheLock(this.root);
		try {
			this.evictionEntries = null;
			for (const item of bundle.original.items)
				if (item.status !== "running")
					await this.saveItem(page, itemBundle(bundle, item), out);
		} finally {
			this.evictionEntries = null;
			await release();
		}
	}
	async saveItem(page, bundle, out) {
		if (this.loads.find((p) => p.page === page)?.external) return;
		const key = this.key(page, bundle.original.items[0]);
		const pending = resolve(this.root, `${key}.pending-${process.pid}`);
		const folder = resolve(this.root, key);
		try {
			const paths = new Set();
			transform(bundle, (value) => {
				if (value.endsWith(".png") && inside(out, value)) paths.add(value);
				return value;
			});
			const replacements = new Map();
			const artifacts = [];
			let size = 0;
			for (const path of paths) {
				const bytes = await readFile(path);
				const name = `asset-${artifacts.length}.png`;
				artifacts.push({ name, digest: hash(bytes) });
				replacements.set(path, `vf-cache:${name}`);
				size += bytes.length;
			}
			const entry = {
				schema: 2,
				key,
				created: Date.now(),
				size,
				artifacts,
				concept: this.setup.concept,
				bundle: transform(bundle, (value) => replacements.get(value) || value),
			};
			const text = JSON.stringify(entry);
			entry.size += Buffer.byteLength(text) + 100;
			if (entry.size > cacheLimit) return;
			await this.evict(entry.size, key);
			await mkdir(pending, { recursive: true });
			for (const [index, path] of [...paths].entries())
				await writeFile(
					resolve(pending, artifacts[index].name),
					await readFile(path),
				);
			await writeFile(resolve(pending, "entry.json"), JSON.stringify(entry));
			await rename(pending, folder);
			this.evictionEntries.push({ ...entry, folder });
		} finally {
			await removeCacheFolder(this.root, pending);
		}
	}
	async evict(incoming, replacement) {
		const entries = this.evictionEntries || [];
		if (!this.evictionEntries) {
			for (const entry of await readdir(this.root, { withFileTypes: true })) {
				if (
					entry.isDirectory() &&
					/^[a-f0-9]{64}\.pending-\d+$/.test(entry.name)
				) {
					await removeCacheFolder(this.root, resolve(this.root, entry.name));
					continue;
				}
				if (!entry.isDirectory() || !/^[a-f0-9]{64}$/.test(entry.name))
					continue;
				const folder = resolve(this.root, entry.name);
				const metadata = await readFile(resolve(folder, "entry.json"), "utf8")
					.then(JSON.parse)
					.catch(() => null);
				if (!metadata) {
					await removeCacheFolder(this.root, folder);
					continue;
				}
				// Published metadata includes every owned artifact plus an upper bound
				// for entry.json. Avoid one filesystem operation per retained frame.
				const size =
					Number.isSafeInteger(metadata.size) && metadata.size > 0
						? metadata.size
						: (
								await Promise.all(
									(
										await readdir(folder)
									).map(
										async (file) => (await stat(resolve(folder, file))).size,
									),
								)
							).reduce((a, b) => a + b, 0);
				entries.push({ ...metadata, folder, size });
			}
			this.evictionEntries = entries;
		}
		const replaced = entries.find((entry) => entry.key === replacement);
		if (replaced) {
			await removeCacheFolder(this.root, replaced.folder);
			entries.splice(entries.indexOf(replaced), 1);
		}
		let total = entries.reduce((sum, entry) => sum + entry.size, incoming);
		for (const entry of [...entries].sort((a, b) => a.created - b.created)) {
			if (total <= cacheLimit) break;
			await removeCacheFolder(this.root, entry.folder);
			total -= entry.size;
			entries.splice(entries.indexOf(entry), 1);
		}
	}
}
