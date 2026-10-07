import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repository = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../../..",
);
const require = createRequire(resolve(repository, "package.json"));
const ts = require("typescript");
const hash = (text) => createHash("sha256").update(text).digest("hex");
const at = (text, offset) => text.slice(0, offset).split("\n").length;

// Domain samples are finite representatives of unbounded strings/numbers, not a claim to enumerate them.
const domains = {
	lang: ["ar", "en"],
	from: ["2026-09-01"],
	to: ["2026-09-10"],
	arrive: ["0", "500", "never"],
	reason: ["", "verification", "x".repeat(240)],
	record: ["missing"],
};

export function extractSwitches(text, file) {
	const source = ts.createSourceFile(
		file,
		text,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.JS,
	);
	const virtualFile = `${file}.js`;
	const host = ts.createCompilerHost({ allowJs: true });
	host.getSourceFile = (name) => (name === virtualFile ? source : undefined);
	const checker = ts
		.createProgram(
			[virtualFile],
			{ allowJs: true, noLib: true, noResolve: true },
			host,
		)
		.getTypeChecker();
	const symbol = (node) => checker.getSymbolAtLocation(node);
	const params = new Set();
	const declarations = new Map();
	const walk = (node, fn) => {
		fn(node);
		ts.forEachChild(node, (child) => walk(child, fn));
	};
	walk(source, (node) => {
		if (ts.isVariableDeclaration(node) && node.initializer)
			declarations.set(symbol(node.name), node.initializer);
		if (
			ts.isVariableDeclaration(node) &&
			node.initializer?.getText(source).includes("new URLSearchParams")
		)
			params.add(symbol(node.name));
	});
	const result = [];
	walk(source, (node) => {
		if (
			!ts.isCallExpression(node) ||
			!ts.isPropertyAccessExpression(node.expression) ||
			!["get", "has", "getAll"].includes(node.expression.name.text)
		)
			return;
		const receiver = node.expression.expression.getText(source);
		if (
			!params.has(symbol(node.expression.expression)) &&
			!receiver.includes("new URLSearchParams")
		)
			return;
		const arg = node.arguments[0];
		if (!arg || !ts.isStringLiteral(arg))
			throw new Error(
				`${file}:${at(text, node.getStart())}: dynamic URL switch cannot be mapped automatically`,
			);
		const name = arg.text;
		const values = new Set(domains[name] || []);
		const aliases = new Set([node.getText(source)]);
		const bindings = new Set();
		let parent = node.parent;
		while (parent && !ts.isStatement(parent)) {
			if (ts.isFunctionLike(parent)) break;
			if (ts.isVariableDeclaration(parent)) {
				let raw = true;
				walk(parent.initializer, (child) => {
					if (
						ts.isBinaryExpression(child) &&
						![
							ts.SyntaxKind.BarBarToken,
							ts.SyntaxKind.QuestionQuestionToken,
						].includes(child.operatorToken.kind)
					)
						raw = false;
					if (ts.isConditionalExpression(child)) raw = false;
				});
				if (raw) bindings.add(symbol(parent.name));
				break;
			}
			parent = parent.parent;
		}
		const mentions = (candidate) =>
			candidate &&
			[...aliases].some((alias) => {
				const value = candidate.getText(source);
				return (
					(ts.isIdentifier(candidate) && bindings.has(symbol(candidate))) ||
					value === alias ||
					(alias.includes("(") && value.includes(alias))
				);
			});
		walk(source, (candidate) => {
			if (ts.isBinaryExpression(candidate)) {
				for (const [left, right] of [
					[candidate.left, candidate.right],
					[candidate.right, candidate.left],
				]) {
					if (mentions(left) && ts.isStringLiteral(right))
						values.add(right.text);
				}
			}
			if (
				ts.isCallExpression(candidate) &&
				ts.isPropertyAccessExpression(candidate.expression) &&
				["includes", "indexOf"].includes(candidate.expression.name.text) &&
				candidate.arguments.some(mentions)
			) {
				let array = candidate.expression.expression;
				if (ts.isIdentifier(array))
					array = declarations.get(symbol(array)) || array;
				if (ts.isElementAccessExpression(array)) {
					let object = array.expression;
					if (ts.isIdentifier(object))
						object = declarations.get(symbol(object)) || object;
					if (ts.isObjectLiteralExpression(object))
						walk(object, (child) => {
							if (
								ts.isStringLiteral(child) &&
								ts.isArrayLiteralExpression(child.parent)
							)
								values.add(child.text);
						});
				}
				if (ts.isArrayLiteralExpression(array))
					for (const element of array.elements)
						if (ts.isStringLiteral(element)) values.add(element.text);
			}
			if (ts.isConditionalExpression(candidate)) {
				let relevant = false;
				walk(candidate.condition, (child) => {
					if (mentions(child)) relevant = true;
				});
				if (relevant)
					for (const branch of [candidate.whenTrue, candidate.whenFalse])
						if (ts.isStringLiteral(branch)) values.add(branch.text);
			}
			if (
				ts.isElementAccessExpression(candidate) &&
				mentions(candidate.argumentExpression) &&
				candidate.expression
			) {
				let object = candidate.expression;
				if (ts.isIdentifier(object))
					object = declarations.get(symbol(object)) || object;
				for (const property of ts.isObjectLiteralExpression(object)
					? object.properties
					: [])
					if (property.name)
						values.add(property.name.text || property.name.getText(source));
			}
		});
		// A literal lookup, default, or comparison surrounding the call (e.g. preset.toLowerCase()).
		let local = node;
		while (local.parent && !ts.isStatement(local.parent)) local = local.parent;
		if (name === "preset")
			walk(local, (n) => {
				if (ts.isPropertyAssignment(n) && n.name)
					values.add(n.name.text || n.name.getText(source));
			});
		result.push({
			name,
			values: [...values]
				.filter((value) => value !== "" || name === "reason")
				.sort(),
			domain: Object.hasOwn(domains, name)
				? "open; samples shown, --query accepts any value"
				: "finite branches; absent value is default",
			source: { file, line: at(text, node.getStart()) },
		});
	});
	return result;
}

const recipe = (id, marker, actions, proof, extra = {}) => ({
	id,
	marker,
	actions,
	proof,
	...extra,
});
const shared = [
	recipe("status", "ops-btn", ["activate:#ops-btn"], {
		selector: "#ops-pop",
		visible: true,
	}),
	recipe(
		"menu",
		"menu-btn",
		["activate:#menu-btn"],
		{ selector: "#menu-pop", visible: true },
		{ widths: "phone" },
	),
	recipe(
		"rail",
		"brand",
		["activate:#brand"],
		{ selector: '#rail[data-open="true"]', visible: true },
		{ widths: "wide" },
	),
	recipe(
		"language",
		"lang-link",
		["activate:#lang-link"],
		{ languageChanged: true },
		{ widths: "wide" },
	),
	recipe(
		"phone-language",
		"menu-lang",
		["activate:#menu-btn", "activate:#menu-lang"],
		{ languageChanged: true },
		{ widths: "phone" },
	),
];
const recipes = {
	"index.html": [
		...shared,
		recipe("details", "details-btn", ["activate:#details-btn"], {
			selector: "#details",
			visible: true,
		}),
		recipe(
			"chart",
			"plot-hit",
			["activate:#plot-hit", "focus:#plot-hit", "press:End"],
			{ selector: "#plot-hit", attribute: "aria-valuetext", nonempty: true },
		),
	],
	"reports.html": [
		...shared,
		recipe(
			"range",
			"dlg-range",
			[],
			{ selector: "#dlg-range[open]", visible: true },
			{ query: { dialog: "range" } },
		),
		recipe(
			"export",
			"dlg-export",
			[],
			{ selector: "#dlg-export[open]", visible: true },
			{ query: { dialog: "export" } },
		),
	],
	"activity.html": [...shared],
	"access.html": [
		...shared,
		...[
			"pinCreate",
			"pinChange",
			"pinOff",
			"add",
			"reset",
			"off",
			"on",
			"mine",
		].map((act) =>
			recipe(
				act,
				`data-act="${act}"`,
				[`activate:[data-act="${act}"]`],
				{
					selector: `#dlg-${({ pinCreate: "pin", pinChange: "pin", pinOff: "pinoff" })[act] || act}[open]`,
					visible: true,
				},
				act === "pinCreate" ? { query: { pin: "none" } } : {},
			),
		),
	],
	"components.html": [
		recipe("date-dialog", "open-dlg", ["activate:#open-dlg"], {
			selector: "#cx-dlg[open]",
			visible: true,
		}),
		recipe("numbers", "numbers", ["activate:#numbers"], {
			selector: "#numbers",
			attribute: "aria-checked",
			value: "true",
		}),
	],
};

// Adapters describe user paths; generation discovers the current families and branch values in the input.
recipes["reports.html"].push(
	recipe("period-7d", "range-seg", ['activate:#range-seg [data-range="7d"]'], {
		selector: '#range-seg [data-range="7d"]',
		attribute: "aria-pressed",
		value: "true",
	}),
	recipe(
		"period-28d",
		"range-seg",
		['activate:#range-seg [data-range="28d"]'],
		{
			selector: '#range-seg [data-range="28d"]',
			attribute: "aria-pressed",
			value: "true",
		},
	),
	recipe(
		"custom-period",
		"range-form",
		['activate:#range-seg [data-range="custom"]'],
		{ selector: "#dlg-range[open]", visible: true },
	),
	recipe("export-open", "export-btn", ["activate:#export-btn"], {
		selector: "#dlg-export[open]",
		visible: true,
	}),
	recipe(
		"export-ready",
		"export-go",
		["activate:#export-btn", "activate:#export-go"],
		{ selector: "#export-save", visible: true },
	),
	recipe(
		"export-failure",
		"export-alert",
		["activate:#export-btn", "activate:#export-go"],
		{ selector: "#export-alert", nonemptyText: true },
		{ query: { export: "fail" } },
	),
	recipe(
		"minute-download",
		"export-save",
		["activate:#export-btn", "activate:#export-go", "download:#export-save"],
		{ download: true },
	),
	recipe("table-download", "table-export", ["download:#table-export"], {
		download: true,
	}),
	recipe(
		"numbers",
		"numbers",
		["activate:#numbers"],
		{ selector: "#numbers", attribute: "aria-checked", value: "true" },
		{ minWidth: 1280 },
	),
	recipe(
		"pattern-grid",
		"heat-tip",
		["activate:#heat .hc"],
		{ selector: "#heat-tip", visible: true },
		{ minWidth: 1280 },
	),
	recipe(
		"pattern-day",
		"wk-b",
		['activate:#pday [data-wd="0"]'],
		{
			selector: '#pday [data-wd="0"]',
			attribute: "aria-checked",
			value: "true",
		},
		{ maxWidth: 1279 },
	),
	recipe(
		"sort-table",
		"data-sort",
		['activate:#days-table [data-sort="peak"]'],
		{
			selector: '#days-table th:has([data-sort="peak"])',
			attribute: "aria-sort",
			nonempty: true,
		},
		{ minWidth: 721 },
	),
	recipe(
		"sort-list",
		"dl-sort",
		["select:#dl-sort=peak-desc"],
		{ selector: "#dl-sort", inputValue: "peak-desc" },
		{ maxWidth: 720 },
	),
	recipe(
		"expand-days",
		"dl-all",
		["activate:#dl-all"],
		{ selector: "#dl-all", attribute: "aria-expanded", value: "true" },
		{ maxWidth: 720 },
	),
);
recipes["activity.html"].push(
	...["all", "count", "access", "settings"].map((kind) =>
		recipe(
			`kind-${kind}`,
			"kind-seg",
			[`activate:#kind-seg [data-kind="${kind}"]`],
			{
				selector: `#kind-seg [data-kind="${kind}"]`,
				attribute: "aria-pressed",
				value: "true",
			},
		),
	),
	...["all", "o1", "o2", "system"].map((person) =>
		recipe(`person-${person}`, 'id="person"', [`select:#person=${person}`], {
			selector: "#person",
			inputValue: person,
		}),
	),
	recipe("dates", "dates-btn", ["activate:#dates-btn"], {
		selector: "#dlg-dates[open]",
		visible: true,
	}),
	recipe("search", "find-btn", ["activate:#find-btn"], {
		selector: "#reason",
		visible: true,
	}),
	recipe(
		"search-reason",
		"reason-clear",
		["activate:#find-btn", "type:#reason=verification", "press:Enter"],
		{ query: { reason: "verification" } },
	),
	recipe(
		"clear-search",
		"reason-clear",
		["activate:#reason-clear"],
		{ selector: "#reason", inputValue: "" },
		{ query: { find: "1", reason: "verification" } },
	),
	recipe("older", 'id="older"', ["activate:#older"], {
		countIncreased: ".rec",
	}),
	recipe(
		"older-failure",
		"older-retry",
		["activate:#older"],
		{ selector: "#older-retry", visible: true },
		{ query: { older: "fail" } },
	),
	recipe(
		"older-working",
		"older-retry",
		["activate:#older"],
		{ selector: "#older", attribute: "aria-busy", value: "true" },
		{ query: { older: "hold" } },
	),
	recipe("refresh", "refresh-alert", ["activate:#refresh"], {
		selector: "#refresh",
		attribute: "aria-busy",
		value: null,
	}),
	recipe(
		"refresh-failure",
		"refresh-alert",
		["activate:#refresh"],
		{ selector: "#refresh-alert", nonemptyText: true },
		{ query: { refresh: "fail" } },
	),
	recipe(
		"refresh-working",
		"refresh-alert",
		["activate:#refresh"],
		{ selector: "#refresh", attribute: "aria-busy", value: "" },
		{ query: { refresh: "hold" } },
	),
);
// Access row controls share a delegated template; each action name is a literal source branch.
for (const act of ["reset", "off", "on", "mine"])
	recipes["access.html"].push(
		recipe(
			act,
			`"${act}"`,
			[
				`activate:[data-act="${act}"][data-id="${act === "mine" ? "o1" : act === "on" ? "o3" : "o2"}"]`,
			],
			{ selector: `#dlg-${act}[open]`, visible: true },
		),
	);
recipes["components.html"].push(
	...["ar", "en"].map((lang) =>
		recipe(
			`language-${lang}`,
			"lang-seg",
			[`activate:#lang-seg [data-lang="${lang}"]`],
			{ language: lang },
		),
	),
	recipe("heat", "heat-tip", ["activate:#heat .cx-hc"], {
		selector: "#heat-tip",
		visible: true,
	}),
	...["ops", "menu"].map((layer) =>
		recipe(
			`header-${layer}`,
			"data-layer",
			[`activate:.cx-live-frame [data-layer="${layer}"]`],
			{ selector: `.cx-live-frame [data-pop="${layer}"]`, visible: true },
		),
	),
);

const pinViewActions = [
	'activate:[data-act="pinChange"]',
	"type:#pin-code=Verify123",
	"activate:#pin-confirm .acc-do",
];
recipes["access.html"].push(
	recipe("pin-view", "pin-view", pinViewActions, {
		selector: '#dlg-pin[data-locked="true"]',
		visible: true,
	}),
	recipe("pin-cancel", "pin-undo", [...pinViewActions, "activate:#pin-undo"], {
		selector: "#dlg-pin",
		hidden: true,
	}),
	recipe(
		"pin-commit",
		"pin-saved",
		[...pinViewActions, "wait:600", "activate:#pin-saved"],
		{ selector: "#notice.done", visible: true },
	),
	recipe(
		"pin-failure",
		"pin-view-alert",
		[...pinViewActions, "wait:600", "activate:#pin-saved"],
		{ selector: "#pin-view-alert", nonemptyText: true },
		{ query: { fail: "1" } },
	),
	recipe(
		"pin-working",
		"pin-saved",
		[...pinViewActions, "wait:600", "activate:#pin-saved"],
		{ selector: "#dlg-pin", attribute: "data-busy", value: "true" },
		{ query: { hold: "1" } },
	),
	recipe(
		"password-reveal",
		"pw-eye",
		['activate:[data-act="mine"][data-id="o1"]', "activate:#dlg-mine .pw-eye"],
		{ selector: "#dlg-mine .pw-eye", attribute: "aria-pressed", value: "true" },
	),
	...["pinChange", "add", "reset", "mine"].map((act) => {
		const dialog = { pinChange: "pin", pinOff: "pinoff" }[act] || act;
		const row = ["reset", "off", "on", "mine"].includes(act)
			? `[data-id="${act === "mine" ? "o1" : act === "on" ? "o3" : "o2"}"]`
			: "";
		return recipe(
			`validate-${act}`,
			`"${act}"`,
			[`activate:[data-act="${act}"]${row}`, `activate:#dlg-${dialog} .acc-do`],
			{ selector: `#dlg-${dialog} [aria-invalid="true"]`, visible: true },
		);
	}),
);

for (const act of ["pinOff", "off", "on"]) {
	const dialog = act === "pinOff" ? "pinoff" : act;
	const row =
		act === "pinOff" ? "" : `[data-id="${act === "on" ? "o3" : "o2"}"]`;
	recipes["access.html"].push(
		recipe(
			`confirm-${act}`,
			`"${act}"`,
			[`activate:[data-act="${act}"]${row}`, `activate:#dlg-${dialog} .acc-do`],
			{ selector: "#notice.done", visible: true },
		),
	);
}

export function controlRecipes(text, file = "tuner.js") {
	const ast = ts.createSourceFile(
		file,
		text,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.JS,
	);
	const result = [];
	const visit = (node) => {
		if (
			ts.isVariableDeclaration(node) &&
			node.name.getText(ast) === "CONTROLS" &&
			ts.isArrayLiteralExpression(node.initializer)
		) {
			for (const item of node.initializer.elements) {
				if (!ts.isObjectLiteralExpression(item))
					throw new Error(
						`${file}:${at(text, item.getStart())}: dynamic tuner control; add an adapter`,
					);
				const properties = Object.fromEntries(
					item.properties
						.filter(ts.isPropertyAssignment)
						.map((property) => [
							property.name.getText(ast),
							property.initializer,
						]),
				);
				if (
					!properties.key ||
					!ts.isStringLiteral(properties.key) ||
					!properties.v ||
					!ts.isStringLiteral(properties.v)
				)
					throw new Error(
						`${file}:${at(text, item.getStart())}: tuner key/token must be literal`,
					);
				const key = properties.key.text;
				result.push({
					id: `tuner-control-${key}`,
					what: properties.en?.text || key,
					reach: "Lights → control",
					actions: [
						"activate:.tuner-toggle",
						`focus:#t-${key}`,
						"press:Home",
						"press:ArrowUp",
					],
					proof: {
						selector: `#t-${key}`,
						rangeStep: true,
						cssPropertyChanged: properties.v.text,
					},
					source: { file, line: at(text, item.getStart()) },
				});
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(ast);
	return result;
}

for (const page of [
	"index.html",
	"reports.html",
	"activity.html",
	"access.html",
])
	recipes[page].push(
		recipe(
			"page-retry",
			"retry",
			["activate:#retry"],
			{ selector: "#retry", hidden: true },
			{ query: { state: "error" } },
		),
	);
recipes["reports.html"].push(
	recipe(
		"export-retry",
		"export-go",
		[
			"activate:#export-btn",
			"activate:#export-go",
			"waitFor:#export-alert:not([hidden])",
			"activate:#export-go",
		],
		{ selector: "#export-save", visible: true },
		{ query: { export: "fail" } },
	),
);
recipes["activity.html"].push(
	recipe(
		"older-retry",
		"older-retry",
		["activate:#older", "waitFor:#older-retry", "activate:#older-retry"],
		{ countIncreased: ".rec" },
		{ query: { older: "fail" } },
	),
);
for (const [page, name, dialog, opener, form] of [
	[
		"reports.html",
		"range",
		"#dlg-range",
		'activate:#range-seg [data-range="custom"]',
		"#range-form",
	],
	[
		"reports.html",
		"export",
		"#dlg-export",
		"activate:#export-btn",
		"#export-form",
	],
	[
		"activity.html",
		"dates",
		"#dlg-dates",
		"activate:#dates-btn",
		"#dates-form",
	],
	[
		"components.html",
		"specimen",
		"#cx-dlg",
		"activate:#open-dlg",
		"#cx-dlg-form",
	],
]) {
	const pick = `activate:${dialog} .dp-day[aria-disabled="false"]`;
	recipes[page].push(
		recipe(
			`picker-${name}-choose`,
			dialog.slice(1),
			[opener, pick, pick, `activate:${form} [type="submit"]`],
			name === "export"
				? { selector: "#export-save", visible: true }
				: { selector: dialog, hidden: true },
		),
		recipe(
			`picker-${name}-keyboard`,
			dialog.slice(1),
			[
				opener,
				`focus:${dialog} .dp-day[tabindex="0"]`,
				"press:PageUp",
				"press:PageDown",
				"press:Home",
				"press:ArrowDown",
				"press:End",
			],
			{ selector: `${dialog} .dp-day[tabindex="0"]`, focused: true },
		),
		recipe(
			`picker-${name}-month`,
			dialog.slice(1),
			[
				opener,
				`activate:${dialog} .dp-step[data-step="-1"]`,
				`activate:${dialog} .dp-step[data-step="1"]`,
			],
			{ selector: `${dialog} .dp-day[tabindex="0"]`, visible: true },
		),
		recipe(
			`picker-${name}-dismiss`,
			dialog.slice(1),
			[opener, "press:Escape"],
			{ selector: dialog, hidden: true },
		),
	);
}
recipes["activity.html"].push(
	recipe(
		"dates-clear",
		"dates-clear",
		[
			"activate:#dates-btn",
			'activate:#dlg-dates .dp-day[aria-disabled="false"]',
			"activate:#dates-clear",
		],
		{ selector: "#dates-clear", hidden: true },
	),
);
const addOwner = [
	'activate:[data-act="add"]',
	"type:#add-name=Verification owner",
	"type:#add-email=verification@example.test",
	"type:#add-pw=VerifyPassword123!",
];
const resetOwner = [
	'activate:[data-act="reset"][data-id="o2"]',
	"type:#reset-pw=VerifyPassword123!",
];
const changePassword = [
	'activate:[data-act="mine"][data-id="o1"]',
	"type:#mine-current=CurrentSynthetic",
	"type:#mine-new=VerifyPassword123!",
];
for (const [name, marker, actions, dialog] of [
	["add-owner", "add-name", addOwner, "add"],
	["reset-password", "reset-pw", resetOwner, "reset"],
	["my-password", "mine-new", changePassword, "mine"],
]) {
	recipes["access.html"].push(
		recipe(name, marker, [...actions, `activate:#dlg-${dialog} .acc-do`], {
			selector: "#notice.done",
			visible: true,
		}),
		recipe(
			`${name}-retry`,
			marker,
			[
				...actions,
				`activate:#dlg-${dialog} .acc-do`,
				`waitFor:#dlg-${dialog} .acc-dlg-alert:not([hidden])`,
				`activate:#dlg-${dialog} .acc-do`,
			],
			{ selector: "#notice.done", visible: true },
			{ query: { fail: "1" } },
		),
	);
}
recipes["access.html"].push(
	recipe(
		"records-retry",
		"rec-retry",
		["activate:#rec-retry"],
		{ selector: "#rec-retry", hidden: true },
		{ query: { records: "error" } },
	),
	recipe("record-navigation", "rec-a", ["activate:.rec-a"], {
		path: "activity.html",
		selector: ".rec:focus",
		visible: true,
	}),
	recipe("pin-copy", "pin-copy", [...pinViewActions, "activate:#pin-copy"], {
		oneOf: [
			{ selector: '#pin-copy[data-state="1"]', visible: true },
			{ selector: "#pin-copy-fail", visible: true },
		],
	}),
	recipe(
		"pin-refused",
		"pin-view-alert",
		[...pinViewActions, "wait:600", "activate:#pin-saved"],
		{ selector: "#pin-view-alert", nonemptyText: true },
		{ query: { refuse: "staff_pin_not_active" } },
	),
	recipe(
		"password-refused",
		"mine-current",
		[...changePassword, "activate:#dlg-mine .acc-do"],
		{ selector: '#mine-current[aria-invalid="true"]', visible: true },
		{ query: { refuse: "current_password_incorrect" } },
	),
);

export function landmarks(text, file) {
	const result = [];
	const patterns = [
		["selector", /#[a-zA-Z][\w-]+(?:\.[\w-]+)?/g],
		["attribute", /data-[\w-]+(?:\s*=\s*["'][^"'\r\n]+["'])?/g],
		["class", /(?:class(?:Name)?\s*[:=]\s*["'`])([^"'`\r\n]+)/g],
		[
			"interaction",
			/([\w.]+)\.addEventListener\(\s*["'](click|change|input|keydown|pointerdown|submit)["']/g,
		],
	];
	for (const [kind, pattern] of patterns)
		for (const match of text.matchAll(pattern))
			result.push({
				kind,
				name: match[0],
				source: { file, line: at(text, match.index) },
			});
	return result;
}

export function generateMap(concept) {
	const sources = new Map();
	const load = (file) => {
		if (!sources.has(file))
			sources.set(file, readFileSync(resolve(concept, file), "utf8"));
		return sources.get(file);
	};
	const spec = existsSync(resolve(concept, "DESIGN-SPEC.md"))
		? load("DESIGN-SPEC.md")
		: "";
	const pages = readdirSync(concept)
		.filter((name) => name.endsWith(".html"))
		.sort()
		.map((page) => {
			const html = load(page);
			const files = [
				page,
				...[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
					.map((match) => match[1])
					.filter((name) => !name.includes(":") && name.endsWith(".js")),
			];
			// Components imports Reports' primitive functions; the page's module exits before its switch parser.
			const activeFiles =
				page === "components.html"
					? files.filter((file) => file !== "reports.js")
					: files;
			const texts = activeFiles.map((file) => ({ file, text: load(file) }));
			for (const file of files) load(file);
			const switches = texts.flatMap(({ file, text }) => {
				if (!file.endsWith(".html")) return extractSwitches(text, file);
				return [
					...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g),
				].flatMap((match) =>
					extractSwitches(match[1], file).map((item) => ({
						...item,
						source: {
							file,
							line: item.source.line + at(text, match.index) - 1,
						},
					})),
				);
			});
			const byName = new Map();
			for (const item of switches) {
				const old = byName.get(item.name);
				if (old) {
					old.values = [...new Set([...old.values, ...item.values])].sort();
					old.sources.push(item.source);
				} else byName.set(item.name, { ...item, sources: [item.source] });
			}
			let ready;
			let readySource;
			for (const { file, text } of texts) {
				const match =
					/(?:window\.)?(__\w+)(?:\.ready\s*=\s*true|\s*=\s*\{\s*ready:\s*true)/.exec(
						text,
					);
				if (match) {
					ready = `window.${match[1]}?.ready === true`;
					readySource = { file, line: at(text, match.index) };
					break;
				}
			}
			if (!ready)
				throw new Error(
					`${page}: no readiness signal; add a source-grounded adapter before verification`,
				);
			const features = [
				{
					id: "page",
					what: `Open ${page}`,
					reach: page,
					actions: [],
					proof: { ready: true },
					source: { file: page, line: 1 },
				},
			];
			for (const item of recipes[page] || []) {
				const found = texts.find(({ text }) => text.includes(item.marker));
				if (!found) continue;
				const selectors = [
					item.proof.selector,
					...item.actions.map((action) =>
						action.slice(action.indexOf(":") + 1),
					),
				].filter(Boolean);
				const selectorSources = [];
				for (const selector of selectors) {
					for (const match of selector.matchAll(/#([\w-]+)/g)) {
						const location = texts.find(({ text }) => text.includes(match[1]));
						if (!location)
							throw new Error(
								`${found.file}:${at(found.text, found.text.indexOf(item.marker))}: ${page} feature ${item.id} selector #${match[1]} absent; repair the adapter before generating a map`,
							);
						selectorSources.push({
							selector: `#${match[1]}`,
							file: location.file,
							line: at(location.text, location.text.indexOf(match[1])),
						});
					}
				}
				features.push({
					...item,
					selectorSources,
					what: item.id,
					reach: item.query
						? `${page}?${new URLSearchParams(item.query)}`
						: item.actions.join(" → "),
					source: {
						file: found.file,
						line: at(found.text, found.text.indexOf(item.marker)),
					},
				});
			}
			// Tuner is shared, gated by its own real toolbar button and keyboard shortcut.
			const tuner = texts.find(({ file }) => file === "tuner.js");
			if (tuner)
				features.push({
					id: "tuner",
					what: "Light tuner",
					reach: "tap Lights",
					actions: ["activate:.tuner-toggle"],
					proof: { selector: "#tuner-panel", visible: true },
					source: {
						file: "tuner.js",
						line: at(tuner.text, tuner.text.indexOf("tuner-toggle")),
					},
				});
			if (tuner) {
				features.push(...controlRecipes(tuner.text));
				const open = "activate:.tuner-toggle";
				const extras = [
					recipe("tuner-close", "tuner-x", [open, "activate:.tuner-x"], {
						selector: "#tuner-panel",
						hidden: true,
					}),
					recipe(
						"tuner-copy",
						"Copy values",
						[open, 'activate:.tuner-actions button:has-text("Copy values")'],
						{ selector: ".tuner-status", nonemptyText: true },
					),
					recipe(
						"tuner-reset",
						"Reset to Recommended",
						[
							open,
							'activate:#tuner-panel [data-preset="v2"]',
							'activate:.tuner-actions button:has-text("Reset to Recommended")',
						],
						{
							selector: '#tuner-panel [data-preset="recommended"]',
							attribute: "aria-pressed",
							value: "true",
						},
					),
					recipe(
						"tuner-move",
						"tuner-grip",
						[open, "focus:.tuner-grip", "press:ArrowDown"],
						{ selector: ".tuner", moved: true },
					),
					recipe(
						"tuner-drag",
						"tuner-grip",
						[open, "gesture:.tuner-grip@0,30,300"],
						{ selector: ".tuner", moved: true },
					),
					recipe(
						"tuner-motion",
						"t-mo-motion",
						[open, "activate:#t-mo-motion"],
						{ selector: "#t-mo-motion", checked: false },
						{ fullMotion: true },
					),
					recipe(
						"tuner-replay",
						"t-mo-replay",
						[open, "activate:#t-mo-replay"],
						{ selector: "#t-mo-replay", visible: true },
						{ fullMotion: true, settleIntro: true },
					),
					...["New reading", "Level up", "Level down"].map((label) =>
						recipe(
							`tuner-${label.toLowerCase().replaceAll(" ", "-")}`,
							label,
							[open, `activate:.tuner-motion button:has-text("${label}")`],
							{ selector: ".t-latest", textChanged: true },
						),
					),
					recipe(
						"tuner-reset-readings",
						"Reset readings",
						[
							open,
							'activate:.tuner-motion button:has-text("New reading")',
							'activate:.tuner-motion button:has-text("Reset readings")',
						],
						{
							selector: '.tuner-motion button:has-text("Reset readings")',
							disabled: true,
						},
					),
					...["speed", "intro"].flatMap((kind) => [
						recipe(
							`tuner-${kind}-speed`,
							`t-mo-${kind}`,
							[open, `focus:#t-mo-${kind}`, "press:Home", "press:ArrowUp"],
							{ selector: `#t-mo-${kind}`, rangeStep: true },
						),
						recipe(
							`tuner-${kind}-reset`,
							`t-mo-${kind}`,
							[
								open,
								`focus:#t-mo-${kind}`,
								"press:Home",
								`activate:#t-mo-${kind === "intro" ? "intro" : "speed"} >> xpath=.. >> button`,
							],
							{ selector: `#t-mo-${kind}`, inputValue: "1" },
						),
					]),
				];
				for (const item of extras)
					features.push({
						...item,
						what: item.id,
						reach: item.actions.join(" → "),
						source: {
							file: "tuner.js",
							line: at(tuner.text, tuner.text.indexOf(item.marker)),
						},
					});
				for (const preset of ["v2", "aLike", "recommended"])
					features.push({
						id: `tuner-preset-${preset}`,
						what: `Choose ${preset} light preset`,
						reach: "Lights → preset",
						actions: [
							"activate:.tuner-toggle",
							`activate:#tuner-panel [data-preset="${preset}"]`,
						],
						proof: {
							selector: `#tuner-panel [data-preset="${preset}"]`,
							attribute: "aria-pressed",
							value: "true",
						},
						source: {
							file: "tuner.js",
							line: at(tuner.text, tuner.text.indexOf("PRESET_NAMES")),
						},
					});
			}
			return {
				page,
				ready,
				readySource,
				switches: [...byName.values()].sort((a, b) =>
					a.name.localeCompare(b.name),
				),
				features,
			};
		});
	return {
		schema: 1,
		generator: hash(readFileSync(fileURLToPath(import.meta.url))),
		sizes: {
			desktop: { width: 1440, height: 900 },
			boundary: { width: 1024, height: 900 },
			tablet: { width: 768, height: 1024 },
			phone: { width: 390, height: 844 },
			narrow: { width: 320, height: 844 },
			zoom: { width: 1440, height: 900, zoom: 2 },
		},
		sizeSource: {
			file: "DESIGN-SPEC.md",
			line: at(spec, spec.indexOf("BRK-1")),
		},
		pages,
		landmarks: [...sources].flatMap(([file, text]) => landmarks(text, file)),
		sources: [...sources]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([file, text]) => ({ file, sha256: hash(text) })),
	};
}

export function drift(map, concept) {
	const current = generateMap(concept);
	const problems = [];
	for (const [left, right, direction] of [
		[current, map, "unmapped"],
		[map, current, "removed or changed"],
	]) {
		for (const page of left.pages) {
			const other = right.pages.find((item) => item.page === page.page);
			if (!other) {
				problems.push(`${page.page}:1: ${direction} page`);
				continue;
			}
			for (const key of ["switches", "features"])
				for (const item of page[key]) {
					const candidate = other[key].find(
						(entry) => (entry.name || entry.id) === (item.name || item.id),
					);
					if (!candidate || JSON.stringify(candidate) !== JSON.stringify(item))
						problems.push(
							`${item.source.file}:${item.source.line}: ${page.page} ${direction} ${key === "switches" ? "switch" : "feature/selector"} ${item.name || item.id}${item.proof?.selector ? ` (${item.proof.selector})` : ""}`,
						);
				}
			if (page.ready !== other.ready)
				problems.push(
					`${page.readySource.file}:${page.readySource.line}: readiness changed`,
				);
		}
	}
	for (const [left, right, direction] of [
		[current.landmarks, map.landmarks || [], "unmapped"],
		[map.landmarks || [], current.landmarks, "removed"],
	]) {
		for (const landmark of left)
			if (
				!right.some(
					(other) =>
						other.kind === landmark.kind &&
						other.name === landmark.name &&
						other.source.file === landmark.source.file,
				)
			)
				problems.push(
					`${landmark.source.file}:${landmark.source.line}: ${direction} ${landmark.kind} ${landmark.name}`,
				);
	}
	for (const source of current.sources)
		if (
			!map.sources.some(
				(old) => old.file === source.file && old.sha256 === source.sha256,
			)
		)
			problems.push(
				`${source.file}:1: source changed; regenerate and review map`,
			);
	if (map.generator !== current.generator)
		problems.push("map.mjs:1: generator changed; regenerate map");
	return [...new Set(problems)];
}

export function checkCommittedMaps(root = repository) {
	const maps = [];
	function visit(dir) {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (
				[".git", "node_modules", ".next", "dist", ".local"].includes(entry.name)
			)
				continue;
			const path = resolve(dir, entry.name);
			if (entry.isDirectory() && !entry.isSymbolicLink()) visit(path);
			else if (entry.name === "verification-map.json") maps.push(path);
		}
	}
	visit(root);
	for (const file of maps) {
		const problems = drift(
			JSON.parse(readFileSync(file, "utf8")),
			dirname(file),
		);
		if (problems.length) throw new Error(problems.join("\n"));
	}
	return maps.length;
}
