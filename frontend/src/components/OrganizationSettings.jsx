function OrganizationSettings({ handleSaveOrganization, orgFields, organization, setOrganization, setOrganizationError, setOrganizationSuccess, isLoadingOrganization, isOrganizationAdmin, organizationError, organizationSuccess, isSavingOrganization, inputClass }) {
	return (
				<section className="card mt-8">
					<h2 className="border-b border-black pb-4 text-lg font-bold">
						Organization
					</h2>

					<form onSubmit={handleSaveOrganization} className="mt-4">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{orgFields.map(({ label, id }) => (
								<div key={id}>
									<label htmlFor={id} className="text-sm font-semibold">
										{label}
									</label>
									<input
										id={id}
										type="text"
										value={organization[id]}
										onChange={(event) => {
											setOrganization((current) => ({
												...current,
												[id]: event.target.value,
											}));
											setOrganizationError("");
											setOrganizationSuccess("");
										}}
										disabled={isLoadingOrganization || !isOrganizationAdmin}
										required={id === "org_name"}
										className={inputClass}
									/>
								</div>
							))}
						</div>

						{!isOrganizationAdmin && (
							<p className="mt-4 text-sm text-gray-600">
								Only organization admins can edit these details.
							</p>
						)}
						{organizationError && (
							<p role="alert" className="mt-4 text-sm text-red-700">
								{organizationError}
							</p>
						)}
						{organizationSuccess && (
							<p role="status" className="mt-4 text-sm text-green-700">
								{organizationSuccess}
							</p>
						)}

						<button
							type="submit"
							disabled={
								isLoadingOrganization ||
								isSavingOrganization ||
								!isOrganizationAdmin
							}
							className="btn-primary mt-6 px-5 py-3 text-sm disabled:opacity-50"
						>
							{isSavingOrganization ? "Saving..." : "Save Organization"}
						</button>
					</form>
				</section>
	);
}

export default OrganizationSettings;
