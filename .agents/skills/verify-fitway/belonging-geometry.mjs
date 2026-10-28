const sameLine = (left, right) => {
	const leftCenter = (left.top + left.bottom) / 2;
	const rightCenter = (right.top + right.bottom) / 2;
	const leftHeight = left.bottom - left.top;
	const rightHeight = right.bottom - right.top;
	return (
		Math.abs(leftCenter - rightCenter) <=
		Math.max(1, Math.min(leftHeight, rightHeight) * 0.6)
	);
};

const unionRect = (rects) => ({
	left: Math.min(...rects.map((rect) => rect.left)),
	top: Math.min(...rects.map((rect) => rect.top)),
	right: Math.max(...rects.map((rect) => rect.right)),
	bottom: Math.max(...rects.map((rect) => rect.bottom)),
});

const overlap = (left, right) =>
	Math.max(
		0,
		Math.min(left.right, right.right) - Math.max(left.left, right.left),
	);

// A neighbour whose antialiased edge touches the far piece by up to 1 px is not stacked under it.
const COLUMN_EDGE_PX = 1;
const cleanText = (value) => String(value).replace(/\s+/g, " ").trim();

function lineGroups(fragments) {
	const lines = [];
	for (const fragment of [...fragments].sort(
		(left, right) =>
			left.rect.top - right.rect.top || left.rect.left - right.rect.left,
	)) {
		let line = lines.find((candidate) =>
			sameLine(candidate.rect, fragment.rect),
		);
		if (!line) {
			line = { rect: fragment.rect, fragments: [] };
			lines.push(line);
		}
		line.fragments.push(fragment);
		line.rect = unionRect([line.rect, fragment.rect]);
	}
	return lines.sort((left, right) => left.rect.top - right.rect.top);
}

function mergeTokens(tokens, direction) {
	const ordered = [...tokens].sort((left, right) =>
		direction === "rtl"
			? right.rect.right - left.rect.right
			: left.rect.left - right.rect.left,
	);
	const pieces = [];
	for (const token of ordered) {
		const previous = pieces.at(-1);
		if (!previous) {
			pieces.push({ ...token, tokenIds: [...token.tokenIds] });
			continue;
		}
		const gap =
			direction === "rtl"
				? previous.rect.left - token.rect.right
				: token.rect.left - previous.rect.right;
		if (gap > Math.max(previous.spaceWidth, token.spaceWidth) * 1.1 + 0.5) {
			pieces.push({ ...token, tokenIds: [...token.tokenIds] });
			continue;
		}
		previous.text = `${previous.text}${gap > 0.1 ? " " : ""}${token.text}`;
		previous.rect = unionRect([previous.rect, token.rect]);
		previous.spaceWidth = Math.max(previous.spaceWidth, token.spaceWidth);
		previous.tokenIds = [...new Set([...previous.tokenIds, ...token.tokenIds])];
	}
	return pieces.map((piece) => ({
		...piece,
		text: cleanText(piece.text),
	}));
}

export function mergeLinePieces(fragments, direction = "ltr") {
	const pieces = [];
	for (const [lineIndex, line] of lineGroups(fragments).entries()) {
		const tokens = [];
		for (const fragment of line.fragments) {
			const token = tokens.find(
				(candidate) => candidate.id === fragment.tokenId,
			);
			if (token) {
				token.rect = unionRect([token.rect, fragment.rect]);
				continue;
			}
			tokens.push({
				id: fragment.tokenId,
				text: cleanText(fragment.text),
				rect: fragment.rect,
				spaceWidth: Math.max(1, fragment.spaceWidth || 1),
				tokenIds: [fragment.tokenId],
				line: lineIndex,
			});
		}
		pieces.push(
			...mergeTokens(tokens, direction).map((piece) => ({
				...piece,
				line: lineIndex,
			})),
		);
	}
	return pieces;
}

function itemColumns(pieces, direction) {
	const columns = [];
	const lineIndexes = [...new Set(pieces.map((piece) => piece.line))].sort(
		(left, right) => left - right,
	);
	for (const lineIndex of lineIndexes) {
		const line = pieces
			.filter((piece) => piece.line === lineIndex)
			.sort((left, right) => left.rect.left - right.rect.left);
		for (let index = 0; index < line.length - 1; index++) {
			const left = line[index];
			const right = line[index + 1];
			if (right.rect.left - left.rect.right <= 0.5) continue;
			const far = direction === "rtl" ? left : right;
			const near = direction === "rtl" ? right : left;
			const farSide = (piece) =>
				direction === "rtl"
					? piece.rect.right <= near.rect.left + 0.5
					: piece.rect.left >= near.rect.right - 0.5;
			const columnPieces = pieces.filter(
				(piece) =>
					piece.line >= far.line &&
					piece.rect.top >= far.rect.top - 0.5 &&
					farSide(piece) &&
					overlap(piece.rect, far.rect) > COLUMN_EDGE_PX,
			);
			const stackedLines = new Set(columnPieces.map((piece) => piece.line));
			if (stackedLines.size < 2) continue;
			columns.push({
				text: columnPieces
					.map((piece) => piece.text)
					.join(" ")
					.trim(),
				rect: unionRect(columnPieces.map((piece) => piece.rect)),
				pieces: columnPieces,
				far,
				near,
			});
		}
	}
	return columns;
}

export function analyzeBelongingItem(item) {
	const direction = item.direction === "rtl" ? "rtl" : "ltr";
	const pieces = mergeLinePieces(item.fragments, direction);
	const columns = itemColumns(pieces, direction);
	const findings = [];
	for (const column of columns) {
		const columnIds = new Set(column.pieces.flatMap((piece) => piece.tokenIds));
		for (const piece of pieces) {
			if (piece.tokenIds.some((id) => columnIds.has(id))) continue;
			if (piece.rect.top < column.rect.top - 0.5) continue;
			const startsNear =
				direction === "rtl"
					? piece.rect.right >= column.near.rect.left - 0.5
					: piece.rect.left <= column.near.rect.right + 0.5;
			const reach = overlap(piece.rect, column.rect);
			if (!startsNear || reach <= 1) continue;
			findings.push({
				text: piece.text,
				columnText: column.text,
				reach,
				tokenIds: piece.tokenIds,
				columnTokenIds: [...columnIds],
				pieceRect: piece.rect,
				columnRect: column.rect,
			});
		}
	}
	const unique = [
		...new Map(
			findings.map((finding) => [
				`${finding.tokenIds.join(",")}|${finding.columnTokenIds.join(",")}`,
				finding,
			]),
		).values(),
	];
	return {
		pieces,
		columns,
		findings: unique,
		hasColumn: columns.length > 0,
	};
}

export function analyzeBelongingItems(items) {
	return items.map((item) => ({
		...item,
		...analyzeBelongingItem(item),
	}));
}
