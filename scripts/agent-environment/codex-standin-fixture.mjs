// Write and run a fake Codex executable for launcher tests.
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// The fake Codex runner every launcher suite drives: a stand-in for `codex exec` on PATH, its
// shim, its turn sequencing (ROUND_SEQUENCE_FILE, ROUND_MESSAGES, ROUND_REPLAY) and the launcher
// invocation. Moved from codex-round.test.ts so the report-field suites use the same runner.

function standinSource(thread) {
	return `const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const args = process.argv.slice(2);
const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  if (args.includes('read-only')) {
    const capture = {args, cwd:process.cwd(), input:Buffer.concat(chunks).toString('base64'), env:{TEMP:process.env.TEMP,TMP:process.env.TMP}, files:fs.readdirSync(process.cwd())};
    fs.appendFileSync(process.env.ROUND_REVIEW_CAPTURE, JSON.stringify(capture) + '\\n');
    if (!process.env.REVIEW_NO_ANSWER) fs.writeFileSync(args[args.indexOf('-o') + 1], process.env.REVIEW_ANSWER_FILE ? fs.readFileSync(process.env.REVIEW_ANSWER_FILE) : process.env.REVIEW_ANSWER || 'No such readings.\\n');
    process.stdout.write('stand-in review\\n');
    process.exitCode = Number(process.env.REVIEW_EXIT || 0);
    return;
  }
  const isResume = args.includes('resume');
  if (process.env.ROUND_WRITE_PATH) fs.writeFileSync(process.env.ROUND_WRITE_PATH, Buffer.from(process.env.ROUND_WRITE_CONTENT, 'base64'));
  if (process.env.ROUND_REMOVE_PATH) fs.unlinkSync(process.env.ROUND_REMOVE_PATH);
  const turnStderr = isResume ? process.env.ROUND_RESUME_STDERR : process.env.ROUND_STDERR;
  if (turnStderr) process.stderr.write(turnStderr);
  let commit = null;
  if (!isResume && process.env.ROUND_COMMIT) {
    if (process.env.ROUND_RESET_HARD) execFileSync('git', ['reset', '--hard', process.env.ROUND_RESET_HARD], {cwd:process.cwd(), stdio:'ignore', windowsHide:true});
    if (process.env.ROUND_COMMIT_STAGE_ALL === '1') execFileSync('git', ['add', '-A'], {cwd:process.cwd(), stdio:'ignore', windowsHide:true});
    execFileSync('git', ['commit', '--allow-empty', '-m', process.env.ROUND_COMMIT], {cwd:process.cwd(), stdio:'ignore', windowsHide:true});
    commit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd:process.cwd(), encoding:'utf8', windowsHide:true}).trim();
  }
  fs.writeFileSync(process.env.ROUND_CAPTURE, JSON.stringify({args, cwd:process.cwd(), input:Buffer.concat(chunks).toString('base64'), env:{TEMP:process.env.TEMP,TMP:process.env.TMP}}));
  const sequenceFile = process.env.ROUND_SEQUENCE_FILE;
  let sequenceIndex = 0;
  if (sequenceFile) {
    try { sequenceIndex = Number(fs.readFileSync(sequenceFile, 'utf8')) || 0; } catch {}
    fs.writeFileSync(sequenceFile, String(sequenceIndex + 1));
  }
  // File-backed replay: each turn's message and events come from the files ROUND_REPLAY names,
  // and the events are written as recorded (the large records exceed an environment value).
  if (process.env.ROUND_REPLAY) {
    const turn = JSON.parse(fs.readFileSync(process.env.ROUND_REPLAY, 'utf8'))[sequenceIndex];
    if (!turn) throw new Error('fixture replay exhausted');
    fs.writeFileSync(args[args.indexOf('-o') + 1], fs.readFileSync(turn.message));
    if (turn.events) process.stdout.write(fs.readFileSync(turn.events));
    return;
  }
  const messages = process.env.ROUND_MESSAGES ? JSON.parse(process.env.ROUND_MESSAGES) : null;
  const exits = process.env.ROUND_EXITS ? JSON.parse(process.env.ROUND_EXITS) : null;
  const configuredMessage = isResume && process.env.ROUND_RESUME_MESSAGE !== undefined
    ? process.env.ROUND_RESUME_MESSAGE
    : process.env.ROUND_MESSAGE;
  const fallbackUsed = !messages && configuredMessage === undefined;
  const fallbackCommand = 'fixture fallback evidence';
  const fallbackOutput = 'fixture fallback evidence PASS';
  const fallbackReport = '\`\`\`report\\n' + JSON.stringify({id:'K1',status:'PASS',command:fallbackCommand,output:fallbackOutput}) + '\\n\`\`\`\\n';
  const fallback = isResume ? 'stand-in resumed message\\n' + fallbackReport : 'stand-in last message\\n' + fallbackReport;
  let message = messages
    ? (messages[sequenceIndex] ?? messages[messages.length - 1])
    : (configuredMessage ?? fallback);
  const renderCommit = (value) => commit
    ? value.replaceAll('__HEAD__', commit).replaceAll('__HEAD_SHORT__', commit.slice(0, 7))
    : value;
  message = renderCommit(message);
  const defaultExit = isResume && process.env.ROUND_RESUME_EXIT !== undefined
    ? process.env.ROUND_RESUME_EXIT
    : process.env.ROUND_EXIT;
  const exitCode = exits
    ? (exits[sequenceIndex] ?? exits[exits.length - 1])
    : defaultExit;
  fs.writeFileSync(args[args.indexOf('-o') + 1], message);
  process.stdout.write('{"type":"thread.star');
  process.stdout.write('ted","thread_id":"${thread}"}\\n');
  if (process.env.ROUND_PRE_EVENTS) process.stdout.write(renderCommit(process.env.ROUND_PRE_EVENTS));
  if (fallbackUsed) process.stdout.write(JSON.stringify({type:'item.completed',item:{type:'command_execution',command:fallbackCommand,aggregated_output:fallbackOutput,exit_code:0,status:'completed'}}) + '\\n');
  if (commit && process.env.ROUND_NO_COMMIT_EVENT !== '1') {
    process.stdout.write(JSON.stringify({type:'item.completed', item:{type:'command_execution', command:'git commit -m ' + JSON.stringify(process.env.ROUND_COMMIT), aggregated_output:'[fixture ' + commit.slice(0, 7) + '] ' + process.env.ROUND_COMMIT, exit_code:0, status:'completed'}}) + '\\n');
  }
  const extraEvents = isResume ? process.env.ROUND_RESUME_EVENTS : process.env.ROUND_EVENTS;
  if (extraEvents) process.stdout.write(renderCommit(extraEvents));
  process.stdout.write('{"type":"item.completed","text":"العربية «»"}\\r\\n');
  process.exitCode = Number(exitCode || 0);
});\n`;
}

export function writeCodexStandin(bin, thread) {
	mkdirSync(bin);
	const standin = path.join(bin, "stand-in.cjs");
	writeFileSync(standin, standinSource(thread));
	if (process.platform === "win32") {
		writeFileSync(
			path.join(bin, "codex.cmd"),
			`@"${process.execPath}" "%~dp0stand-in.cjs" %*\r\n`,
		);
	} else {
		const executable = path.join(bin, "codex");
		writeFileSync(
			executable,
			`#!/bin/sh\nexec '${process.execPath.replaceAll("'", "'\\''")}' '${standin.replaceAll("'", "'\\''")}' "$@"\n`,
		);
		chmodSync(executable, 0o755);
	}
	return standin;
}

export function runLauncher(script, args, { cwd, env }) {
	const result = spawnSync(process.execPath, [script, ...args], {
		cwd,
		env,
		encoding: "utf8",
		windowsHide: true,
	});
	if (result.error) throw result.error;
	return { ...result, output: result.stdout + result.stderr };
}
