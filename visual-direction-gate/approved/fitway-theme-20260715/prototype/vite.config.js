import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repoRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const previewRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	root: repoRoot,
	plugins: [react()],
	resolve: {
		alias: {
			react: path.resolve(previewRoot, "node_modules/react"),
			"react-dom": path.resolve(previewRoot, "node_modules/react-dom"),
		},
	},
	server: {
		host: "127.0.0.1",
		port: 4178,
		strictPort: true,
		fs: { allow: [repoRoot] },
	},
	build: {
		outDir: path.resolve(previewRoot, "dist"),
		emptyOutDir: true,
		rollupOptions: {
			input: path.resolve(previewRoot, "index.html"),
		},
	},
	preview: {
		host: "127.0.0.1",
		port: 4178,
		strictPort: true,
	},
});
