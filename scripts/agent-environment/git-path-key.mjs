// Normalize Git paths and case-insensitive BOM exception keys.
export function normalizeGitPath(value) {
	return value.replaceAll("\\", "/");
}

export function bomExceptionPathKey(value) {
	return normalizeGitPath(value)
		.replace(/\/+/g, "/")
		.replace(/^\.\//, "")
		.toLowerCase();
}
