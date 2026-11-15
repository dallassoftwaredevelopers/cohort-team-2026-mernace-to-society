import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

function TeamRolesSettings({
	teamMemberActionError, teamMemberSuccess, teamColumns, hideOnMobile,
	canEditTeam, isLoadingTeamMembers, teamMembersError, teamMembers, formatRole,
	authUser, teamDrafts, updateTeamDraft, pendingTeamChanges, showTeamReview,
	setShowTeamReview, isSavingTeam, handleConfirmTeamChanges, roleDescriptions,
}) {
	const dialogRef = useRef(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (showTeamReview && !dialog.open) dialog.showModal();
		if (!showTeamReview && dialog.open) dialog.close();
	}, [showTeamReview]);

	return (
				<>
					<section className="card mt-8">
						<div className="border-b border-black pb-4">
							<h2 className="text-lg font-bold">Team Members</h2>
							<p className="mt-1 text-sm">
								People in your organization and what they can do.
							</p>
						</div>

						{teamMemberActionError && (
							<p className="mt-4 text-sm text-red-700" role="alert">
								{teamMemberActionError}
							</p>
						)}
						{teamMemberSuccess && (
							<p className="mt-4 text-sm text-green-700" role="status">
								{teamMemberSuccess}
							</p>
						)}
						{!canEditTeam && (
							<p className="mt-4 text-sm text-gray-600">
								Only organization admins can change team members.
							</p>
						)}
						{pendingTeamChanges.length > 0 && (
							<p className="mt-4 text-sm text-gray-600" role="status">
								Changes shown below are pending until confirmed.
							</p>
						)}

						<div className="overflow-x-auto">
						<table className="mt-4 w-full rounded-lg bg-white text-left text-sm">
							<thead>
								<tr className="text-xs uppercase">
									{teamColumns.map((col) => (
										<th
											key={col.key}
											className={`px-4 py-3 font-semibold ${hideOnMobile(col)}`}
										>
											{col.label}
										</th>
									))}
									{canEditTeam && (
										<th className="px-4 py-3 text-right font-semibold">
											Actions
										</th>
									)}
								</tr>
							</thead>

							<tbody>
								{isLoadingTeamMembers && (
									<tr className="border-t border-section">
										<td
											colSpan={teamColumns.length + (canEditTeam ? 1 : 0)}
											className="px-4 py-4 text-center"
										>
											Loading team members...
										</td>
									</tr>
								)}
								{!isLoadingTeamMembers && teamMembersError && (
									<tr className="border-t border-section">
										<td
											colSpan={teamColumns.length + (canEditTeam ? 1 : 0)}
											className="px-4 py-4 text-center text-red-700"
											role="alert"
										>
											{teamMembersError}
										</td>
									</tr>
								)}
								{!isLoadingTeamMembers &&
									!teamMembersError &&
									teamMembers.length === 0 && (
										<tr className="border-t border-section">
											<td
												colSpan={teamColumns.length + (canEditTeam ? 1 : 0)}
												className="px-4 py-4 text-center"
											>
												No team members found.
											</td>
										</tr>
									)}
								{!isLoadingTeamMembers &&
									!teamMembersError &&
									teamMembers.map((member) => (
										<tr key={member.id} className="border-t border-section">
											{teamColumns.map((col) => (
												<td
													key={col.key}
													className={`px-4 py-3 ${hideOnMobile(col)}`}
												>
													{col.key === "status" ? (
														<span
															className={`rounded-full px-3 py-1 text-xs font-semibold ${
																(teamDrafts[member.id]?.status ?? member.status) === "active"
																	? "bg-green-100 text-green-800"
																	: "bg-secondary text-gray-700"
															}`}
														>
															{formatRole(teamDrafts[member.id]?.status ?? member.status)}
														</span>
													) : col.key === "role" ? (
														formatRole(teamDrafts[member.id]?.role ?? member.role)
													) : (
														member[col.key] || "—"
													)}
												</td>
											))}
											{canEditTeam && (
												<td className="px-4 py-3 text-right">
													{member.id === authUser?.id ? (
														<span className="text-xs text-gray-500">
															Your account
														</span>
													) : (
														<div className="flex items-center justify-end gap-2">
															<div className="relative">
															<select
																aria-label={`Role for ${member.name || member.email}`}
																value={teamDrafts[member.id]?.role ?? member.role?.toLowerCase() ?? "staff"}
																disabled={isSavingTeam}
																onChange={(e) =>
																	updateTeamDraft(member, { role: e.target.value })
																}
																className="appearance-none rounded-lg border border-secondary bg-white py-3 pl-4 pr-10 text-sm"
															>
																<option value="staff">Staff</option>
																<option value="manager">Manager</option>
																<option value="admin">Admin</option>
															</select>
															<ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
															</div>
															<button
																type="button"
																className="btn-secondary min-w-32 px-4 py-3 text-sm disabled:opacity-50"
																disabled={isSavingTeam}
																onClick={() =>
																	updateTeamDraft(member, {
																		status: (teamDrafts[member.id]?.status ?? member.status) === "active" ? "inactive" : "active",
																	})
																}
															>
																{(teamDrafts[member.id]?.status ?? member.status) === "active" ? "Set inactive" : "Set active"}
															</button>
														</div>
													)}
												</td>
											)}
										</tr>
									))}
							</tbody>
						</table>
						</div>
						{canEditTeam && (
							<div className="mt-6 flex justify-end">
								<button
									type="button"
									className="btn-primary px-5 py-3 text-sm disabled:opacity-50"
									disabled={!pendingTeamChanges.length || isLoadingTeamMembers || !!teamMembersError || isSavingTeam}
									onClick={() => setShowTeamReview(true)}
								>
									Review and Confirm
								</button>
							</div>
						)}
					</section>

					<dialog
						ref={dialogRef}
						aria-labelledby="team-review-title"
						onCancel={(event) => {
							event.preventDefault();
							if (!isSavingTeam) setShowTeamReview(false);
						}}
						className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl backdrop:bg-black/50"
					>
						<h2 id="team-review-title" className="text-lg font-bold">Review team changes</h2>
						<p className="mt-2 text-sm">Changes will only be applied when you confirm.</p>
						<ul className="mt-4 space-y-3">
							{pendingTeamChanges.map(({ member, changes }) => (
								<li key={member.id} className="rounded-lg bg-section p-4 text-sm">
									<p className="font-semibold">{member.name || member.email}</p>
									{changes.role !== undefined && (
										<p>Role: {formatRole(member.role)} → {formatRole(changes.role)}</p>
									)}
									{changes.status !== undefined && (
										<p>Status: {formatRole(member.status)} → {formatRole(changes.status)}</p>
									)}
								</li>
							))}
						</ul>
						{teamMemberActionError && (
							<p className="mt-4 text-sm text-red-700" role="alert">{teamMemberActionError}</p>
						)}
						<div className="mt-6 flex flex-wrap justify-end gap-2">
							<button type="button" className="btn-secondary px-5 py-3 text-sm disabled:opacity-50" disabled={isSavingTeam} onClick={() => setShowTeamReview(false)}>Cancel</button>
							<button type="button" className="btn-primary px-5 py-3 text-sm disabled:opacity-50" disabled={isSavingTeam || !pendingTeamChanges.length} onClick={handleConfirmTeamChanges}>
								{isSavingTeam ? "Saving..." : "Confirm Changes"}
							</button>
						</div>
					</dialog>

					{/* Role descriptions */}
					<section className="card mt-8">
						<h2 className="border-b border-black pb-4 text-lg font-bold">
							Roles
						</h2>
						<dl className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
							{roleDescriptions.map(({ role, note }) => (
								<div key={role} className="rounded-lg bg-white p-4">
									<dt className="font-semibold">{role}</dt>
									<dd className="mt-1 text-sm">{note}</dd>
								</div>
							))}
						</dl>
					</section>
				</>
	);
}

export default TeamRolesSettings;
