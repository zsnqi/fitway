// JSON-schema setup and pointer-based path reads.

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

function getObjectPath(value, keyPath) {
	if (keyPath === "") return { found: true, value };
	const parts = keyPath
		.replace(/^\.?/, "")
		.split(".")
		.filter((part) => part.length > 0);
	let current = value;
	for (const part of parts) {
		if (
			current === null ||
			typeof current !== "object" ||
			!Object.hasOwn(current, part)
		) {
			return { found: false };
		}
		current = current[part];
	}
	return { found: true, value: current };
}

function decodeJsonPointer(pointer) {
	if (pointer === "") return [];
	if (!pointer.startsWith("/")) return null;
	return pointer
		.slice(1)
		.split("/")
		.map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function getJsonPointer(value, pointer) {
	const parts = decodeJsonPointer(pointer);
	if (parts === null) return { found: false };
	let current = value;
	for (const part of parts) {
		if (Array.isArray(current)) {
			if (
				part === "-" ||
				!/^\d+$/.test(part) ||
				Number(part) >= current.length
			) {
				return { found: false };
			}
			current = current[Number(part)];
			continue;
		}
		if (
			current === null ||
			typeof current !== "object" ||
			!Object.hasOwn(current, part)
		) {
			return { found: false };
		}
		current = current[part];
	}
	return { found: true, value: current };
}

async function readText(root, relativePath) {
	return await readFile(path.resolve(root, relativePath), "utf8");
}

export { getJsonPointer, getObjectPath, makeAjv, readText, schemaErrors };
