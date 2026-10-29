// JSON-schema setup, schema error messages, and reading a repository text file.

import { readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

function makeAjv() {
	const ajv = new Ajv2020({ allErrors: true, strict: true });
	addFormats(ajv);
	return ajv;
}

function schemaErrors(label, errors) {
	return `${label} schema validation failed: ${JSON.stringify(errors ?? [], null, 2)}`;
}

async function readText(root, relativePath) {
	return await readFile(path.resolve(root, relativePath), "utf8");
}

export { makeAjv, readText, schemaErrors };
