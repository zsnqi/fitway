import { expect, test } from "@playwright/test";

const serverUrl = "http://localhost:3100";
const ownerEmail = "owner@demo.fitway.local";
const isLiveDesktopDemo =
	process.env.FITWAY_PLAYWRIGHT_BASE_URL === "http://localhost:3101" &&
	process.env.FITWAY_PLAYWRIGHT_SKIP_WEBSERVER === "true";

test.skip(
	!isLiveDesktopDemo,
	"The unmocked desktop-demo proof runs only through pnpm demo:verify.",
);

function credential(
	name: "FITWAY_DEMO_OWNER_PASSWORD" | "FITWAY_DEMO_STAFF_PIN",
) {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is required for the live desktop demo`);
	return value;
}

const ownerPassword = isLiveDesktopDemo
	? credential("FITWAY_DEMO_OWNER_PASSWORD")
	: "";
const staffPin = isLiveDesktopDemo ? credential("FITWAY_DEMO_STAFF_PIN") : "";
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
	await expect(page.getByLabel("Access code")).toBeVisible();
	const status = await page.evaluate(
		async ({ pin, server }) =>
			(
				await fetch(`${server}/api/auth/staff/pin`, {
					method: "POST",
					credentials: "include",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ pin }),
				})
			).status,
		{ pin: staffPin, server: serverUrl },
	);
	expect(status).toBe(200);
	await page.goto("/staff");
	await expect(page.getByRole("heading", { name: "Monitoring" })).toBeVisible();
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
	await expect(
		page.getByRole("heading", { name: "Daily analytics", exact: true }),
	).toBeVisible({ timeout: 15_000 });
	await expect(
		page.getByRole("heading", {
			name: "People present through the day",
			exact: true,
		}),
	).toBeVisible();

	await page.getByRole("tab", { name: "Reports" }).click();
	await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible({
		timeout: 15_000,
	});
	await expect(
		page.getByRole("heading", { name: "Occupancy by weekday and hour" }),
	).toBeVisible({ timeout: 45_000 });

	await page.getByRole("tab", { name: "Accounts & Sign-in" }).click();
	await expect(
		page.getByRole("heading", { name: "Access", exact: true }),
	).toBeVisible({ timeout: 15_000 });
	await expect(
		page.getByRole("heading", { name: "Staff access PIN", exact: true }),
	).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText(ownerEmail, { exact: true })).toBeVisible();

	await page.getByRole("tab", { name: "Activity Log" }).click();
	await expect(
		page.getByRole("heading", { name: "Audit history", exact: true }),
	).toBeVisible({ timeout: 15_000 });
	await expect(
		page.getByRole("cell", { name: "Staff PIN provisioned", exact: true }),
	).toBeVisible();

	await page.getByRole("tab", { name: "System Status" }).click();
	await expect(
		page.getByRole("heading", {
			name: "Uptime and incidents",
			exact: true,
		}),
	).toBeVisible({ timeout: 15_000 });

	await page.getByRole("tab", { name: "Settings" }).click();
	await expect(
		page.getByRole("heading", { name: "Settings", exact: true }),
	).toBeVisible({ timeout: 15_000 });
});
