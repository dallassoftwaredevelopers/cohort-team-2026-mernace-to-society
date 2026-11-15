function OrganizationSettings({
  handleSaveOrganization,
  orgFields,
  organization,
  setOrganization,
  setOrganizationError,
  setOrganizationSuccess,
  isLoadingOrganization,
  isOrganizationAdmin,
  organizationError,
  organizationSuccess,
  isSavingOrganization,
  inputClass,
}) {
  return (
    <section className="card mt-8">
      <h2 className="section-title">Organization</h2>

      <form onSubmit={handleSaveOrganization} className="mt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {orgFields.map(({ label, id }) => (
            <div key={id}>
              <label htmlFor={id} className="label">
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
          <p role="alert" className="alert-error mt-4">
            {organizationError}
          </p>
        )}
        {organizationSuccess && (
          <p role="status" className="alert-success mt-4">
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
