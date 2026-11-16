import { assertEquals, assertRejects } from "jsr:@std/assert";
import { verifyMemberEmail } from "../team-members/verifyMemberEmail.js";

function client(result) {
	return { auth: { admin: { getUserById: async () => result } } };
}

Deno.test("verified members may be activated", async () => {
	assertEquals(await verifyMemberEmail(client({ data: { user: { email_confirmed_at: "2026-11-16T00:00:00Z" } }, error: null }), "user"), true);
});

Deno.test("unverified members cannot be activated", async () => {
	assertEquals(await verifyMemberEmail(client({ data: { user: { email_confirmed_at: null } }, error: null }), "user"), false);
});

Deno.test("missing accounts and Auth errors are surfaced", async () => {
	await assertRejects(() => verifyMemberEmail(client({ data: { user: null }, error: null }), "user"), Error, "could not be found");
	await assertRejects(() => verifyMemberEmail(client({ data: { user: null }, error: { message: "Auth unavailable" } }), "user"), Error, "Auth unavailable");
});
