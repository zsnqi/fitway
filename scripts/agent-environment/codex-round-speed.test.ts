// Prove a GPT round runs at Fast on a Business account only, whatever the user's own speed setting is.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { fixture, GPT_MODEL } from "./codex-round-test-support.ts";
import { accountSpeed } from "./codex-speed.mjs";

const duringOffer = Date.parse("2026-12-31T23:59:59Z");
const afterOffer = Date.parse("2027-01-01T00:00:00Z");

function token(plan: string) {
	const claims = { "https://api.openai.com/auth": { chatgpt_plan_type: plan } };
	return `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;
}

function signIn(codexHome: string, plan: string, firstPlan = plan) {
	writeFileSync(
		path.join(codexHome, "auth.json"),
		JSON.stringify({
			tokens: { access_token: token(plan), id_token: token(firstPlan) },
		}),
	);
}

const homes: string[] = [];

function emptyHome() {
	const home = mkdtempSync(path.join(tmpdir(), "fitway-codex-speed-"));
	homes.push(home);
	return home;
}

afterEach(() => {
	for (const home of homes.splice(0))
		rmSync(home, { recursive: true, force: true });
});

describe("the speed an account's plan allows", () => {
	it.each([
		["team", "priority"],
		["business", "priority"],
		["plus", "default"],
		["pro", "default"],
		["free", "default"],
	])("%s runs at %s during the offer", async (plan, speed) => {
		const home = emptyHome();
		signIn(home, plan);
		expect(await accountSpeed({ CODEX_HOME: home }, duringOffer)).toEqual({
			plan,
			speed,
		});
	});

	it("returns a Business account to Standard when the offer ends", async () => {
		const home = emptyHome();
		signIn(home, "team");
		expect(await accountSpeed({ CODEX_HOME: home }, afterOffer)).toEqual({
			plan: "team",
			speed: "default",
		});
	});

	it("reads the chosen workspace, not the plan of the first sign-in", async () => {
		const business = emptyHome();
		signIn(business, "team", "plus");
		const personal = emptyHome();
		signIn(personal, "plus", "team");
		expect(
			(await accountSpeed({ CODEX_HOME: business }, duringOffer)).speed,
		).toBe("priority");
		expect(
			(await accountSpeed({ CODEX_HOME: personal }, duringOffer)).speed,
		).toBe("default");
	});

	it.each([
		["missing", undefined],
		["not JSON", "{"],
		["without tokens", "{}"],
		["with an unreadable token", '{"tokens":{"access_token":"x"}}'],
	])("stays at Standard when the sign-in is %s", async (_name, content) => {
		const home = emptyHome();
		if (content !== undefined)
			writeFileSync(path.join(home, "auth.json"), content);
		expect(await accountSpeed({ CODEX_HOME: home }, duringOffer)).toEqual({
			plan: "unknown",
			speed: "default",
		});
	});
});

describe("the speed a round is launched with", () => {
	it("follows the signed-in account at launch and again at resume", async () => {
		const f = fixture();
		signIn(f.codexHome, "team");
		const business = await accountSpeed({ CODEX_HOME: f.codexHome });
		const launch = f.invoke([
			f.brief,
			"high",
			"--model",
			GPT_MODEL,
			"--run",
			f.run,
		]);
		expect(launch.status, launch.output).toBe(0);
		expect(f.captured().args).toContain(`service_tier=${business.speed}`);
		expect(launch.stdout).toContain(
			`Speed: ${business.speed} (Codex plan: team)`,
		);

		signIn(f.codexHome, "plus");
		const resume = f.invokeRaw(["resume", f.run]);
		expect(resume.status, resume.output).toBe(0);
		expect(f.captured().args).toContain("resume");
		expect(f.captured().args).toContain("service_tier=default");
		expect(resume.stdout).toContain("Speed: default (Codex plan: plus)");
	});

	it("leaves a DeepSeek round's arguments alone", () => {
		const f = fixture();
		signIn(f.codexHome, "team");
		const result = f.invokeRaw([f.brief, "--run", f.run]);
		expect(result.status, result.output).toBe(0);
		expect(
			f.captured().args.some((value) => value.startsWith("service_tier=")),
		).toBe(false);
		expect(result.stdout).not.toContain("Speed:");
	});
});
