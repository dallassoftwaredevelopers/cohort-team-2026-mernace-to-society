import { assertEquals } from "jsr:@std/assert";
import { validateTeamMemberUpdate } from "../team-members/validateTeamMemberUpdate.js";

const currentUserId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-000000000002";

Deno.test("accepts status, role, and combined team changes", () => {
	for (const changes of [
		{ status: "inactive" },
		{ status: "active" },
		{ role: "staff" },
		{ role: "manager" },
		{ role: "admin", status: "inactive" },
	]) {
		assertEquals(validateTeamMemberUpdate({ userId, ...changes }, currentUserId), null);
	}
});

Deno.test("rejects malformed or invalid team changes", () => {
	for (const body of [
		null, [], {}, { userId }, { userId: "invalid", role: "admin" },
		{ userId, role: "owner" }, { userId, role: null },
		{ userId, status: "disabled" }, { userId, status: null },
	]) {
		assertEquals(
			validateTeamMemberUpdate(body, currentUserId),
			"A userId and a valid status or role are required.",
		);
	}
});

Deno.test("prevents changing your own role or deactivating your account", () => {
	for (const changes of [
		{ role: "staff" },
		{ status: "inactive" },
		{ role: "admin", status: "active" },
	]) {
		assertEquals(
			validateTeamMemberUpdate({ userId: currentUserId, ...changes }, currentUserId),
			"You cannot change your own role or set your account to inactive.",
		);
	}
});
