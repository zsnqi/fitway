import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../../apps/server/.env") });

const suppliedToken = process.env.FITWAY_EDGE_TOKEN;
const token = suppliedToken || randomBytes(32).toString("base64url");
if (token.length < 43)
	throw new Error("FITWAY_EDGE_TOKEN must encode at least 32 random bytes");
const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");
const { db } = await import("../src/index");
const { edgeDevices } = await import("../src/schema/application");
const { eq } = await import("drizzle-orm");
const name = "phase-2-development-simulator";
const [existing] = await db
	.select({ id: edgeDevices.id })
	.from(edgeDevices)
	.where(eq(edgeDevices.name, name))
	.limit(1);
let id: string;
if (existing) {
	id = existing.id;
	await db
		.update(edgeDevices)
		.set({ tokenHash, enabled: true, updatedAt: new Date() })
		.where(eq(edgeDevices.id, id));
} else {
	const [created] = await db
		.insert(edgeDevices)
		.values({ name, tokenHash })
		.returning({ id: edgeDevices.id });
	if (!created) throw new Error("Device provisioning did not return an id");
	id = created.id;
}
console.log(`Provisioned simulated development device ${name} (${id}).`);
if (suppliedToken) {
	console.log(
		"Used FITWAY_EDGE_TOKEN from the local environment; raw token was not printed.",
	);
} else {
	console.log("Raw token (shown once; store only in an ignored local secret):");
	console.log(token);
}
await db.$client.end();
