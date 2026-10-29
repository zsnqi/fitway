// Scan shell command words and unwrap PowerShell or Bash command wrappers.
// The launcher's one reader of a shell command: the words of a command line, and the command
// Codex ran inside a `powershell ... -Command <x>` or `bash ... -lc <x>` wrapper. Commit detection
// in codex-round.mjs and report-row matching in codex-report.mjs both read recorded commands
// through unwrapCommand, so the two checks never disagree about what a record ran.

function shellSeparator(text, index) {
	const character = text[index];
	if (character === ";" || character === "\n") return character;
	if ((character === "&" || character === "|") && text[index + 1] === character)
		return character + character;
	return character === "&" || character === "|" ? character : null;
}

function shellEvent(raw, value, whitespace = false) {
	return whitespace ? { raw, whitespace: true } : { raw, value };
}

export function shellScan(command, shell = "bash") {
	const events = [];
	const escapeCharacter = shell === "powershell" ? "`" : "\\";
	let quote = null;
	let wordStarted = false;
	for (let index = 0; index < command.length; index += 1) {
		const character = command[index];
		if (quote === "'") {
			if (character === "'") quote = null;
			events.push(shellEvent(character, character === "'" ? "" : character));
			continue;
		}
		// Inside Bash double quotes a backslash escapes only $ ` " \ and a new line.
		if (
			quote === '"' &&
			shell === "bash" &&
			character === "\\" &&
			!'$`"\\\n'.includes(command[index + 1] ?? "\\")
		) {
			events.push(shellEvent(character, character));
			continue;
		}
		if (character === escapeCharacter && index + 1 < command.length) {
			const next = command[++index];
			events.push(shellEvent(character + next, next));
			wordStarted = true;
			continue;
		}
		if (quote === '"') {
			if (character === '"') {
				quote = null;
				events.push(shellEvent(character, ""));
			} else events.push(shellEvent(character, character));
			continue;
		}
		if (character === "'" || character === '"') {
			quote = character;
			wordStarted = true;
			events.push(shellEvent(character, ""));
			continue;
		}
		if (character === "#" && !wordStarted) {
			while (index + 1 < command.length && !/[\r\n]/.test(command[index + 1]))
				index += 1;
			continue;
		}
		if (character === "\r") {
			events.push(shellEvent("", "", true));
			continue;
		}
		const separator = shellSeparator(command, index);
		if (separator !== null) {
			events.push({ raw: separator, separator });
			wordStarted = false;
			if (separator.length === 2) index += 1;
			continue;
		}
		const whitespace = /\s/.test(character);
		events.push(shellEvent(character, character, whitespace));
		wordStarted = !whitespace;
	}
	return { events, unmatchedQuote: quote !== null };
}

export function shellTokens(command, shell = "bash") {
	const { events, unmatchedQuote } = shellScan(command.trim(), shell);
	if (unmatchedQuote) return null;
	const tokens = [];
	let token = "";
	for (const event of events) {
		if (event.whitespace || event.separator === "\n") {
			if (token) {
				tokens.push(token);
				token = "";
			}
			continue;
		}
		if (event.separator !== undefined) {
			token += event.raw;
			continue;
		}
		token += event.value;
	}
	if (token) tokens.push(token);
	return tokens;
}

// Codex records a command as one string quoted by POSIX rules (its shlex join), so the record
// is read as Bash words; the last word after a wrapper's -Command or -lc, with its quoting
// removed, is the command that ran, and it is read by its own shell's rules from then on.
const WRAPPERS = [
	{
		shell: "powershell",
		program: /^powershell(?:\.exe)?$/i,
		flag: /^-Command$/i,
	},
	{ shell: "bash", program: /^bash(?:\.exe)?$/i, flag: /^-lc$/i },
];

function recordedWords(text) {
	const { events, unmatchedQuote } = shellScan(text);
	if (unmatchedQuote) return null;
	const words = [];
	let word = null;
	for (const event of events) {
		// A separator outside quotes means more than one command: not a wrapper.
		if (event.separator !== undefined) return null;
		if (event.whitespace) {
			if (word !== null) words.push(word);
			word = null;
			continue;
		}
		word = (word ?? "") + event.value;
	}
	if (word !== null) words.push(word);
	return words;
}

export function unwrapCommand(command) {
	const text = command.trim();
	const words = recordedWords(text);
	if (words && words.length >= 3) {
		const program = words[0].split(/[\\/]/).at(-1);
		const options = words.slice(1, -2);
		for (const wrapper of WRAPPERS)
			if (
				wrapper.program.test(program) &&
				wrapper.flag.test(words.at(-2)) &&
				options.every((option) => option.startsWith("-"))
			)
				return { text: words.at(-1).trim(), shell: wrapper.shell };
	}
	return { text, shell: "bash" };
}
