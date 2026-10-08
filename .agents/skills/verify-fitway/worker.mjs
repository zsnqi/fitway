// Run an unchanged Node tool with cancellation delivered inside its own process.
// On Windows, child.kill() force-terminates Node and skips Playwright's cleanup hooks.
import { pathToFileURL } from "node:url";

let cancelled = false;
function cancel() {
	if (cancelled) return;
	cancelled = true;
	if (process.listenerCount("SIGINT")) process.emit("SIGINT");
	else process.exit(130);
}
process.on("message", (message) => {
	if (message === "cancel") cancel();
});
process.once("disconnect", cancel);
process.channel?.unref();
const [, , script, ...args] = process.argv;
process.argv = [process.execPath, script, ...args];
await import(pathToFileURL(script));
