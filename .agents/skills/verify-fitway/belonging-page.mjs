export function installBelongingPageHelpers() {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	window.__verifyBelongingPage = {
		visible(element) {
			for (let current = element; current; current = current.parentElement) {
				if (current.hidden) return false;
				const style = getComputedStyle(current);
				if (
					style.display === "none" ||
					style.visibility === "hidden" ||
					style.visibility === "collapse" ||
					Number(style.opacity) === 0
				)
					return false;
			}
			return true;
		},
		selectorFor(element) {
			if (element.id) {
				const selector = `#${CSS.escape(element.id)}`;
				if (document.querySelectorAll(selector).length === 1) return selector;
			}
			const parts = [];
			for (let current = element; current && current !== document.body; ) {
				let part = current.localName;
				const parent = current.parentElement;
				if (parent) {
					const siblings = [...parent.children].filter(
						(sibling) => sibling.localName === current.localName,
					);
					if (siblings.length > 1)
						part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
				}
				parts.unshift(part);
				const selector = parts.join(" > ");
				if (document.querySelectorAll(selector).length === 1) return selector;
				current = parent;
			}
			return parts.join(" > ");
		},
		spaceWidth(element) {
			const style = getComputedStyle(element);
			context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
			return Math.max(
				1,
				context.measureText(" ").width,
				Number.parseFloat(style.fontSize || "0") * 0.35,
			);
		},
	};
}

export function collectBelongingItems({ itemSelector }) {
	const helpers = window.__verifyBelongingPage;
	if (!helpers) throw new Error("Belonging page helpers are not installed");
	const ignoredParents = new Set(["script", "style", "noscript", "template"]);
	const tokenRanges = new Map();
	let nextTokenId = 1;
	const elements = [...document.querySelectorAll(itemSelector)].filter(
		(element) => {
			const rect = element.getBoundingClientRect();
			return rect.width > 0 && rect.height > 0 && helpers.visible(element);
		},
	);
	const elementSet = new Set(elements);
	const fragmentsByItem = new Map(elements.map((element) => [element, []]));
	const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		if (!node.nodeValue?.trim()) continue;
		const parent = node.parentElement;
		if (!parent || ignoredParents.has(parent.localName)) continue;
		const owner = parent.closest(itemSelector);
		if (!owner || !elementSet.has(owner) || !helpers.visible(parent)) continue;
		if (parent.closest(".sr-only")) continue;
		const fragments = fragmentsByItem.get(owner);
		for (const match of node.nodeValue.matchAll(/\S+/gu)) {
			const tokenId = nextTokenId++;
			const range = document.createRange();
			range.setStart(node, match.index);
			range.setEnd(node, match.index + match[0].length);
			const rects = [...range.getClientRects()].filter(
				(rect) => rect.width > 0 && rect.height > 0,
			);
			if (!rects.length) continue;
			tokenRanges.set(tokenId, range);
			const measuredSpace = helpers.spaceWidth(parent);
			for (const rect of rects)
				fragments.push({
					tokenId,
					text: match[0],
					spaceWidth: measuredSpace,
					rect: {
						left: rect.left,
						top: rect.top,
						right: rect.right,
						bottom: rect.bottom,
					},
				});
		}
	}

	window.__verifyBelonging = { tokenRanges };
	return elements.map((element) => ({
		selector: helpers.selectorFor(element),
		direction: getComputedStyle(element).direction,
		fragments: fragmentsByItem.get(element),
	}));
}

export function outlineBelongingTokens({
	selector,
	pieceTokenIds,
	columnTokenIds,
}) {
	const state = window.__verifyBelonging;
	if (!state) throw new Error("Belonging geometry has not been measured");
	window.__verifyBelongingOverlay?.remove();
	const layer = document.createElement("div");
	layer.dataset.verifyBelongingOverlay = "true";
	layer.style.cssText =
		"position:fixed;inset:0;pointer-events:none;z-index:2147483647";
	const item = document.querySelector(selector);
	if (!item) throw new Error(`Belonging item disappeared: ${selector}`);
	const itemRect = item.getBoundingClientRect();
	const unionFor = (ids) => {
		const rects = ids.flatMap((id) => {
			const range = state.tokenRanges.get(id);
			return range ? [...range.getClientRects()] : [];
		});
		if (!rects.length) return null;
		return {
			left: Math.min(...rects.map((rect) => rect.left)),
			top: Math.min(...rects.map((rect) => rect.top)),
			right: Math.max(...rects.map((rect) => rect.right)),
			bottom: Math.max(...rects.map((rect) => rect.bottom)),
		};
	};
	const box = (rect, color, dashed = false) => {
		const element = document.createElement("div");
		element.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.right - rect.left}px;height:${rect.bottom - rect.top}px;box-sizing:border-box;border:2px ${dashed ? "dashed" : "solid"} ${color};pointer-events:none`;
		layer.append(element);
	};
	const piece = unionFor(pieceTokenIds);
	// The piece's 2 px border runs just outside its line box, 2 px clear of its first and last glyphs.
	if (piece)
		box(
			{
				left: piece.left - 4,
				top: piece.top - 2,
				right: piece.right + 4,
				bottom: piece.bottom + 2,
			},
			"#ff3355",
		);
	const column = unionFor(columnTokenIds);
	if (column)
		box(
			{
				left: Math.max(itemRect.left, column.left - 2),
				top: Math.max(itemRect.top, column.top - 2),
				right: column.right,
				bottom: column.bottom,
			},
			"#00c8ff",
			true,
		);
	document.body.append(layer);
	window.__verifyBelongingOverlay = layer;
}

export function clearBelongingOutlines() {
	window.__verifyBelongingOverlay?.remove();
	window.__verifyBelongingOverlay = null;
}
