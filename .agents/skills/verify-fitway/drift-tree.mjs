import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	realpathSync,
	rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { coverageProblems, generateMap, repository } from "./map.mjs";

// The concept's recipes live on the branch where its pages are built, not on every line that
// runs the ladder (F252). A checkout without a recipe file checks the declared branch's concept
// from Git instead, so drift-tree never passes having checked nothing.
export const CONCEPT_SOURCE =
	".agents/skills/verify-fitway/concept-source.json";

const failure = (message, fix) => Object.assign(new Error(message), { fix });

function checkRecipes(concept, recipePath) {
	const problems = coverageProblems(generateMap(concept, recipePath), concept);
	if (problems.length) throw new Error(problems.join("\n"));
}

function committedRecipes(root) {
	const found = [];
	const visit = (dir) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (
				[".git", "node_modules", ".next", "dist", ".local"].includes(entry.name)
			)
				continue;
			const path = resolve(dir, entry.name);
			if (entry.isDirectory() && !entry.isSymbolicLink()) visit(path);
			else if (entry.name === "verification-recipes.json") found.push(path);
		}
	};
	visit(root);
	return found;
}

function git(root, args, env = {}) {
	return spawnSync("git", ["-C", root, ...args], {
		encoding: "utf8",
		windowsHide: true,
		env: { ...process.env, ...env },
	});
}

export function extractDeclaredConcept(root) {
	const declaration = resolve(root, CONCEPT_SOURCE);
	if (!existsSync(declaration))
		throw failure(
			`no verification-recipes.json under ${root} and no ${CONCEPT_SOURCE}; nothing was checked.`,
			`commit the concept's verification-recipes.json beside it, or declare {"concept", "ref"} in ${CONCEPT_SOURCE}`,
		);
	const { concept, ref } = JSON.parse(readFileSync(declaration, "utf8"));
	const commit = git(root, [
		"rev-parse",
		"--verify",
		"--quiet",
		`${ref}^{commit}`,
	]).stdout.trim();
	if (!commit)
		throw failure(
			`no verification-recipes.json under ${root}, and ${ref} (${CONCEPT_SOURCE}) is not in this clone; nothing was checked.`,
			`git -C '${root.replaceAll("'", "''")}' fetch origin, or point ${CONCEPT_SOURCE} at the branch that holds the concept's recipes`,
		);
	const scratch = realpathSync.native(
		mkdtempSync(resolve(tmpdir(), "verify-fitway-drift-")),
	);
	// A private index keeps this checkout's index and files untouched.
	const index = { GIT_INDEX_FILE: resolve(scratch, "index") };
	const tree = resolve(scratch, "concept");
	try {
		mkdirSync(tree);
		for (const args of [
			["read-tree", `${commit}:${concept}`],
			[`--work-tree=${tree}`, "checkout-index", "--all"],
		]) {
			const result = git(root, args, index);
			if (result.status !== 0)
				throw new Error(
					`git ${args.join(" ")} failed for ${concept} at ${ref}: ${result.stderr.trim()}`,
				);
		}
		const recipes = resolve(tree, "verification-recipes.json");
		if (!existsSync(recipes))
			throw failure(
				`${concept} at ${ref} (${commit.slice(0, 8)}) has no verification-recipes.json; nothing was checked.`,
				`commit the recipes beside the concept on that branch, or point ${CONCEPT_SOURCE} at the branch that holds them`,
			);
		return {
			concept: tree,
			declaredConcept: concept,
			recipes,
			commit,
			ref,
			cleanup: () => rmSync(scratch, { recursive: true, force: true }),
		};
	} catch (error) {
		rmSync(scratch, { recursive: true, force: true });
		throw error;
	}
}

function checkDeclaredConcept(root) {
	const extracted = extractDeclaredConcept(root);
	try {
		checkRecipes(extracted.concept, extracted.recipes);
	} finally {
		extracted.cleanup();
	}
	return `DRIFT PASS: no recipe file in this checkout; checked ${extracted.declaredConcept} at ${extracted.ref} (${extracted.commit.slice(0, 8)}).`;
}

export function checkVerificationMaps(root = repository) {
	const found = committedRecipes(root);
	for (const path of found) checkRecipes(dirname(path), path);
	return found.length
		? `DRIFT PASS: ${found.length} recipe files found and checked.`
		: checkDeclaredConcept(root);
}
