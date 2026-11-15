export function validateTeamMemberUpdate(body, currentUserId) {
	if (
		typeof body !== "object" ||
		body === null ||
		Array.isArray(body) ||
		typeof body.userId !== "string" ||
		!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.userId) ||
		(body.status === undefined && body.role === undefined) ||
		(body.status !== undefined && !["active", "inactive"].includes(body.status)) ||
		(body.role !== undefined && !["staff", "manager", "admin"].includes(body.role))
	) {
		return "A userId and a valid status or role are required.";
	}

	if (
		body.userId === currentUserId &&
		(body.status === "inactive" || body.role !== undefined)
	) {
		return "You cannot change your own role or set your account to inactive.";
	}

	return null;
}
