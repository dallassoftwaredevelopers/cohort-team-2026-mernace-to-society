import { createClient } from "npm:@supabase/supabase-js@2";
import { withSupabase } from "jsr:@supabase/server@^1";

export default {
	fetch: withSupabase({ auth: "user" }, async (req, { supabase }) => {
		if (req.method !== "GET" && req.method !== "PATCH") {
			return Response.json(
				{ error: "Method not allowed" },
				{
					status: 405,
					headers: { Allow: "GET, PATCH" },
				},
			);
		}

		const { data: currentUsers, error: currentUserError } =
			await supabase.rpc("get_current_user_profile");
		if (currentUserError) {
			return Response.json(
				{ error: currentUserError.message },
				{ status: 500 },
			);
		}

		const currentUser = currentUsers?.[0];
		if (!currentUser) {
			return Response.json(
				{ error: "Your account profile could not be found." },
				{ status: 404 },
			);
		}

		const { data: currentStatus, error: currentStatusError } =
			await supabase.rpc("get_current_user_status");
		if (currentStatusError) {
			return Response.json(
				{ error: currentStatusError.message },
				{ status: 500 },
			);
		}
		if (currentStatus !== "active") {
			return Response.json(
				{ error: "Your account is not active." },
				{ status: 403 },
			);
		}

		if (
			req.method === "PATCH" &&
			currentUser.role?.toLowerCase() !== "admin"
		) {
			return Response.json(
				{ error: "Only organization admins can change member status." },
				{ status: 403 },
			);
		}

		const { data: organizations, error: organizationError } =
			await supabase.rpc("get_current_organization");

		if (organizationError) {
			return Response.json(
				{ error: organizationError.message },
				{ status: 500 },
			);
		}

		const organization = organizations?.[0];
		if (!organization) {
			return Response.json(
				{ error: "Your account is not linked to an organization." },
				{ status: 404 },
			);
		}

		const supabaseUrl = Deno.env.get("SUPABASE_URL");
		const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
		if (!supabaseUrl || !serviceRoleKey) {
			return Response.json(
				{ error: "Team member lookup is not configured on the server." },
				{ status: 500 },
			);
		}

		const adminClient = createClient(supabaseUrl, serviceRoleKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});

		if (req.method === "PATCH") {
			let body;
			try {
				body = await req.json();
			} catch {
				return Response.json(
					{ error: "Invalid JSON" },
					{ status: 400 },
				);
			}

			if (
				typeof body !== "object" ||
				body === null ||
				Array.isArray(body) ||
				typeof body.userId !== "string" ||
				!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.userId) ||
				!["active", "inactive"].includes(body.status)
			) {
				return Response.json(
					{ error: "A userId and valid status are required." },
					{ status: 400 },
				);
			}

			if (
				body.userId === currentUser.id &&
				body.status === "inactive"
			) {
				return Response.json(
					{ error: "You cannot set your own account to inactive." },
					{ status: 400 },
				);
			}

			const { data: targetUser, error: targetUserError } = await adminClient
				.from("user")
				.select("id, status")
				.eq("id", body.userId)
				.eq("org_id", organization.id)
				.maybeSingle();

			if (targetUserError) {
				return Response.json(
					{ error: targetUserError.message },
					{ status: 500 },
				);
			}
			if (!targetUser) {
				return Response.json(
					{ error: "That member does not belong to your organization." },
					{ status: 404 },
				);
			}

			const { error: statusUpdateError } = await adminClient
				.from("user")
				.update({ status: body.status })
				.eq("id", targetUser.id)
				.eq("org_id", organization.id);

			if (statusUpdateError) {
				return Response.json(
					{ error: statusUpdateError.message },
					{ status: 500 },
				);
			}

			const { error: authUpdateError } =
				await adminClient.auth.admin.updateUserById(targetUser.id, {
					ban_duration: body.status === "inactive" ? "876000h" : "none",
				});

			if (authUpdateError) {
				const { error: rollbackError } = await adminClient
					.from("user")
					.update({ status: targetUser.status })
					.eq("id", targetUser.id)
					.eq("org_id", organization.id);

				return Response.json(
					{
						error: rollbackError
							? `Could not update Auth access (${authUpdateError.message}) or restore the profile status (${rollbackError.message}).`
							: `Could not update Auth access; profile status was restored. ${authUpdateError.message}`,
					},
					{ status: 500 },
				);
			}
		}

		const { data: members, error: membersError } = await adminClient
			.from("user")
			.select("id, name, email, role, status")
			.eq("org_id", organization.id)
			.order("name", { ascending: true });

		if (membersError) {
			return Response.json(
				{ error: membersError.message },
				{ status: 500 },
			);
		}

		return Response.json({ members });
	}),
};
