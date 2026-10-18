import { fileURLToPath } from "node:url";
import { main } from "./codex-execution.mjs";
import { samePath } from "./path-identity.mjs";
import { beginToolCommand } from "./tool-contract.mjs";

if (
	process.argv[1] &&
	(await samePath(fileURLToPath(import.meta.url), process.argv[1]))
) {
	const parsed = beginToolCommand("codex:round", process.argv.slice(2));
	process.exitCode = await main(parsed);
}
