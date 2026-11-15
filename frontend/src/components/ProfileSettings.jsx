function ProfileSettings({ handleSaveProfile, initials, displayedName, authUser, profile, profileError, profileErrorMessage, profileSuccessMessage, name, setName, setProfileErrorMessage, setProfileSuccessMessage, isProfileLoading, isUpdating, showPasswordForm, setShowPasswordForm, handleUpdatePassword, passwordFields, passwords, setPasswords, passwordError, passwordSuccess, inputClass, formatRole }) {
	return (
				<>
					<section className="card mt-8">
						<h2 className="border-b border-black pb-4 text-lg font-bold">
							Profile
						</h2>

						<form onSubmit={handleSaveProfile} className="mt-4">
							<div className="flex items-center gap-4">
								<div
									className="flex h-14 w-14 items-center justify-center rounded-full bg-sidebar text-lg font-bold text-white"
									aria-hidden="true"
								>
									{initials}
								</div>
								<div>
									<p className="font-semibold">
										{displayedName || authUser?.email || "Account"}
									</p>
									<p className="text-sm">{formatRole(profile?.role)}</p>
								</div>
							</div>

							{profileError && (
								<p role="alert" className="mt-4 text-sm text-red-700">
									{profileError}
								</p>
							)}
							{profileErrorMessage && (
								<p role="alert" className="mt-4 text-sm text-red-700">
									{profileErrorMessage}
								</p>
							)}
							{profileSuccessMessage && (
								<p role="status" className="mt-4 text-sm text-green-700">
									{profileSuccessMessage}
								</p>
							)}

							<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<label htmlFor="name" className="text-sm font-semibold">
										Full Name
									</label>
									<input
										id="name"
										type="text"
										value={name ?? profile?.name ?? ""}
										onChange={(event) => {
											setName(event.target.value);
											setProfileErrorMessage("");
											setProfileSuccessMessage("");
										}}
										disabled={isProfileLoading || !profile}
										required
										className={inputClass}
									/>
								</div>
								<div>
									<label htmlFor="email" className="text-sm font-semibold">
										Email
									</label>
									<input
										id="email"
										type="email"
										value={authUser?.email ?? profile?.email ?? ""}
										readOnly
										className={`${inputClass} bg-gray-100`}
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={isProfileLoading || !profile || isUpdating}
								className="btn-primary mt-6 px-5 py-3 text-sm disabled:opacity-50"
							>
								{isUpdating ? "Saving..." : "Save Profile"}
							</button>
						</form>
					</section>

					{/* Password: managed by Supabase Auth, separate from the app profile row. */}
					<section className="card mt-8">
						<h2 className="border-b border-black pb-4 text-lg font-bold">
							Password
						</h2>
						<button
							type="button"
							onClick={() => setShowPasswordForm(!showPasswordForm)}
							aria-expanded={showPasswordForm}
							aria-controls="password-form"
							className="btn-secondary mt-4 px-5 py-3 text-sm"
						>
							Change password
						</button>
						<div
							id="password-form"
							className={`grid transition-all duration-300 ease-in-out ${
								showPasswordForm
									? "grid-rows-[1fr] opacity-100"
									: "grid-rows-[0fr] opacity-0"
							}`}
							inert={!showPasswordForm}
						>
							<div className="overflow-hidden">
								<form onSubmit={handleUpdatePassword} className="mt-4">
									<div className="grid grid-cols-1 gap-4 md:w-1/2">
										{passwordFields.map(
											({ label, id, autoComplete, placeholder }) => (
												<div key={id}>
													<label htmlFor={id} className="text-sm font-semibold">
														{label}
													</label>
													<input
														id={id}
														type="password"
														autoComplete={autoComplete}
														placeholder={placeholder}
														value={passwords[id]}
														onChange={(e) =>
															setPasswords({
																...passwords,
																[id]: e.target.value,
															})
														}
														required
														className={inputClass}
													/>
												</div>
											),
										)}
									</div>

									{passwordError && (
										<p role="alert" className="mt-4 text-sm text-red-600">
											{passwordError}
										</p>
									)}

									{passwordSuccess && (
										<p role="status" className="mt-4 text-sm text-green-700">
											{passwordSuccess}
										</p>
									)}

									<button
										type="submit"
										disabled={isUpdating}
										className="btn-primary mt-6 px-5 py-3 text-sm disabled:opacity-50"
									>
										{isUpdating ? "Updating..." : "Update password"}
									</button>
								</form>
							</div>
						</div>
					</section>
				</>
	);
}

export default ProfileSettings;
