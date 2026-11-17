export async function verifyMemberEmail(adminClient, userId) {
	const { data, error } = await adminClient.auth.admin.getUserById(userId);
	if (error) {
		throw new Error(`Could not check the member's email verification: ${error.message}`);
	}
	if (!data.user) {
		throw new Error("The member's authentication account could not be found.");
	}
	return Boolean(data.user.email_confirmed_at);
}
