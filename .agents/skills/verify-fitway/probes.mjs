import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { runInThisContext } from "node:vm";
import { lineAt, ts } from "./discover.mjs";

// The concept lib also boots its own server/Playwright environment at import time.
// Consume its exact self-contained measurement exports, without executing that
// unrelated bootstrap. A changed, unsupported export fails instead of substituting
// a copied implementation. No source or package files are written to the input.
export function sourceProbe(file, name) {
	const text = readFileSync(file, "utf8");
	const ast = ts.createSourceFile(
		file,
		text,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.JS,
	);
	for (const statement of ast.statements) {
		if (
			!ts.isVariableStatement(statement) ||
			!statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
		)
			continue;
		const declaration = statement.declarationList.declarations.find(
			(d) => d.name.getText(ast) === name,
		);
		if (
			declaration &&
			(ts.isArrowFunction(declaration.initializer) ||
				ts.isFunctionExpression(declaration.initializer))
		)
			return {
				fn: runInThisContext(`(${declaration.initializer.getText(ast)})`, {
					filename: file,
				}),
				source: { file, line: lineAt(text, declaration.getStart(ast)) },
			};
	}
	throw new Error(
		`${file}:1: ${name} is not a self-contained function export; update the probe adapter before verification.`,
	);
}

export async function loadProbes(concept) {
	const file = resolve(concept, "tools/probes/lib.mjs");
	const intro = sourceProbe(file, "introSettled");
	const overflow = sourceProbe(file, "overflowProbe");
	const geometry = await import(
		pathToFileURL(resolve(concept, "tools/probes/geom.mjs"))
	);
	const accessibility = await import(
		pathToFileURL(resolve(concept, "tools/probes/a11y.mjs"))
	);
	return {
		introSettled: intro.fn,
		overflowProbe: overflow.fn,
		geometryProbe: geometry.geometryProbe,
		accessibilityProbe: accessibility.accessibilityProbe,
		sources: [intro.source, overflow.source],
	};
}
