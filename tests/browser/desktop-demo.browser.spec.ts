import { expect, test } from "@playwright/test";

const serverUrl = "http://localhost:3100";
const ownerEmail = "owner@demo.fitway.local";

function credential(
	name: "FITWAY_DEMO_OWNER_PASSWORD" | "FITWAY_DEMO_STAFF_PIN",
) {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is required for the live desktop demo`);
	return value;
}

const ownerPassword = credential("FITWAY_DEMO_OWNER_PASSWORD");
const staffPin = credential("FITWAY_DEMO_STAFF_PIN");
const browserEnvironment = Object.fromEntries(
	Object.entries(process.env).filter(
		([name, value]) =>
			value !== undefined &&
			name !== "FITWAY_DEMO_OWNER_PASSWORD" &&
			name !== "FITWAY_DEMO_STAFF_PIN",
	),
) as Record<string, string>;
test.use({ launchOptions: { env: browserEnvironment } });
// The coordinator must retain the values long enough to create its worker.
// Each worker captures them above, then removes them before Chromium launches.
if (process.env.TEST_WORKER_INDEX !== undefined) {
	delete process.env.FITWAY_DEMO_OWNER_PASSWORD;
	delete process.env.FITWAY_DEMO_STAFF_PIN;
}

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
});

test("anonymous Public is live while protected Staff redirects to login", async ({
	page,
}) => {
	const publicResponse = page.waitForResponse(
		(response) => response.url() === `${serverUrl}/public/occupancy`,
	);
	await page.goto("/");
	expect((await publicResponse).status()).toBe(200);
	await expect(
		page.getByText("Live update", { exact: true }).first(),
	).toBeVisible();
	await expect(page.locator(".public-live__count-value")).toHaveText(
		/^[1-9]\d*$/u,
	);

	await page.goto("/staff");
	await expect(page).toHaveURL(/\/login$/u);
	await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("real Staff PIN opens monitoring and the server denies Owner", async ({
	page,
}) => {
	await page.goto("/login");
	await page.getByLabel("Access code").fill(staffPin);
	await page.getByRole("button", { name: "Sign in" }).click();
	await expect(page).toHaveURL(/\/staff$/u);
	await expect(
		page.getByRole("heading", { name: "Live operations" }),
	).toBeVisible();
	await expect(page.getByText("Crowd level", { exact: true })).toBeVisible();
	await expect(page.locator(".sboard__count-value")).toHaveText(/^[1-9]\d*$/u);
	await expect(page.getByRole("link", { name: "Owner area" })).toHaveCount(0);

	await page.goto("/admin");
	await expect(
		page.getByRole("heading", { name: "Owner access required" }),
	).toBeVisible();
	await expect(page.getByRole("alert")).toContainText(
		"This staff session can use live operations",
	);
});

test("real Owner password opens every populated owner surface", async ({
	page,
}) => {
	test.setTimeout(60_000);
	await page.goto("/");
	const status = await page.evaluate(
		async ({ email, password, server }) =>
			(
				await fetch(`${server}/api/auth/owner/password`, {
					method: "POST",
					credentials: "include",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email, password }),
				})
			).status,
		{
			email: ownerEmail,
			password: ownerPassword,
			server: serverUrl,
		},
	);
	expect(status).toBe(200);

	await page.goto("/admin");
	for (const heading of [
		"Today's occupancy curve",
		"Audit history",
		"Uptime and incidents",
		"Access and owners",
		"Settings",
	]) {
		await expect(
			page.getByRole("heading", { name: heading, exact: true }),
		).toBeVisible({ timeout: 15_000 });
	}
	await expect(page.getByText(ownerEmail, { exact: true })).toBeVisible();
	await expect(
		page.getByRole("cell", { name: "Staff PIN provisioned", exact: true }),
	).toBeVisible();

	await page.getByRole("tab", { name: "History" }).click();
	await expect(
		page.getByRole("heading", { name: "Busiest times and direction" }),
	).toBeVisible({ timeout: 15_000 });
	await expect(
		page.getByRole("heading", { name: "Weekday by hour" }),
	).toBeVisible({ timeout: 45_000 });
});
