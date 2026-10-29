// Turn skipped Windows verification tests into failures through a test wrapper.
import { before } from "node:test";

const violations = new Set();
let installed = false;

function refuse(label, why) {
	const message = `Verification test skipped on Windows: ${label}; reason: ${why || "no reason supplied"}`;
	violations.add(message);
	throw new Error(message);
}

function installHookGuard() {
	if (installed) return;
	installed = true;
	// Hooks run before the wrapped test body, and teardown runs after it. Guard
	// their shared context too; the exit audit catches swallowed teardown refusals.
	before((context) => {
		Object.getPrototypeOf(context).skip = function (why) {
			refuse(this.name || "<anonymous>", why);
		};
	});
	process.once("exit", () => {
		if (!violations.size) return;
		for (const message of violations) console.error(message);
		process.exitCode = 1;
	});
}

function testArguments(first, second, third) {
	if (typeof first === "function")
		return { name: first.name || "<anonymous>", options: {}, fn: first };
	if (first && typeof first === "object")
		return { name: second?.name || "<anonymous>", options: first, fn: second };
	return {
		name: first,
		options: typeof second === "function" ? {} : second || {},
		fn: typeof second === "function" ? second : third,
	};
}

// Windows verification has no optional tests. Platform skips elsewhere retain
// Node's behavior; declared and runtime skips here become named failures.
export function verificationTest(nodeTest, platform = process.platform) {
	if (platform !== "win32") return nodeTest;
	installHookGuard();
	const register = (...args) => {
		const { name, options, fn } = testArguments(...args);
		return nodeTest(name, { ...options, skip: false }, async (context) => {
			let skipped;
			const refused = (label, why) => {
				skipped = `Verification test skipped on Windows: ${label}; reason: ${why || "no reason supplied"}`;
				refuse(label, why);
			};
			if (options.skip)
				refused(
					name,
					options.skip === true
						? "declared skip without a reason"
						: options.skip,
				);
			const guard = (t, label) => {
				t.skip = (why) => refused(label, why);
				const nested = t.test.bind(t);
				t.test = (...childArgs) => {
					const childSpec = testArguments(...childArgs);
					return nested(
						childSpec.name,
						{ ...childSpec.options, skip: false },
						async (child) => {
							if (childSpec.options.skip)
								refused(childSpec.name, childSpec.options.skip);
							guard(child, childSpec.name);
							await childSpec.fn?.(child);
							if (skipped) throw new Error(skipped);
						},
					);
				};
			};
			guard(context, name);
			await fn?.(context);
			if (skipped) throw new Error(skipped);
		});
	};
	register.skip = (...args) => {
		const spec = testArguments(...args);
		return register(spec.name, { ...spec.options, skip: "test.skip" }, spec.fn);
	};
	return register;
}
