import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import {
  formatRole,
  getInitials,
  useUserProfile,
} from "../hooks/useUserProfile";
import { canManageTeam } from "../utils/permissions";

const tabs = ["Profile", "Organization", "Payment Methods", "Team & Roles"];

const inputClass =
  "mt-1 w-full rounded-lg border border-secondary bg-white px-4 py-3 text-sm";

// Edge Function errors include the server response body with the user-facing message.
async function getFunctionError(error, fallback) {
  const responseBody = await error?.context?.json?.().catch(() => null);
  return new Error(responseBody?.error ?? error?.message ?? fallback);
}

// Password changes use Supabase Auth; name and role are stored in the app profile.
const passwordFields = [
  { label: "Current Password", id: "current_password", autoComplete: "current-password", placeholder: "Enter your current password"},
  { label: "New Password", id: "new_password", autoComplete: "new-password", placeholder: "Enter a new password"},
  { label: "Confirm New Password", id: "confirm_new_password", autoComplete: "new-password", placeholder: "Re-enter your new password"},
];

// Organization form IDs map to the component state; request field names are mapped on save.
const orgFields = [
  { label: "Organization Name", id: "org_name" },
  { label: "Street", id: "org_street" },
  { label: "City", id: "org_city" },
  { label: "State", id: "org_state" },
  { label: "Zip", id: "org_zip" },
  { label: "Phone", id: "org_phone" },
];

// Payment method UI is a placeholder until a payment_method table/processor integration exists.
// no payment_method table in Supabase yet; type matches vendor_account.payment_type
const paymentColumns = [
  { label: "Method", key: "nickname" },
  { label: "Type", key: "type" },
  { label: "Used By", key: "vendor_accounts" },
  { label: "Status", key: "status" },
];

// keys match vendor_account.payment_type (ach | card | check)
const methodTypes = [
  { label: "Bank Account (ACH)", key: "ach" },
  { label: "Card", key: "card" },
  { label: "Check", key: "check" },
];

// card numbers should come from a payment processor (e.g. Stripe) later — never stored in our DB
const fieldsByType = {
  ach: [
    { label: "Nickname", id: "nickname", placeholder: "e.g. Reserve account" },
    { label: "Routing Number", id: "routing_number" },
    { label: "Account Number", id: "account_number" },
  ],
  card: [
    { label: "Nickname", id: "nickname", placeholder: "e.g. Company card" },
    { label: "Cardholder Name", id: "cardholder_name" },
    { label: "Expiration (MM/YY)", id: "expiration" },
  ],
  check: [
    { label: "Nickname", id: "nickname", placeholder: "e.g. Check payments" },
    { label: "Drawn On Account", id: "drawn_on" },
    { label: "Starting Check #", id: "starting_check_number" },
  ],
};

// Status is managed manually in public.user until team actions are implemented.
const teamColumns = [
  { label: "Name", key: "name", mobile: true },
  { label: "Email", key: "email" },
  { label: "Role", key: "role", mobile: true },
  { label: "Status", key: "status" },
];

const roleDescriptions = [
  {
    role: "Staff",
    note: "Can upload and view bills, properties, and vendors, but cannot edit records.",
  },
  {
    role: "Manager",
    note: "Can edit bills, properties, and vendors, manage team members, and handle bill approvals.",
  },
  {
    role: "Admin",
    note: "Can edit bills, properties, and vendors, manage team members, and access organization settings.",
  },
];

const hideOnMobile = (col) => (col.mobile ? "" : "hidden md:table-cell");

function AccountSettingsPage() {
  const { authUser, profile, isLoading: isProfileLoading, error: profileError, updateProfileName } =
    useUserProfile();

  // Each tab owns separate form state so unfinished settings don't overwrite saved profile data.
  const [activeTab, setActiveTab] = useState("Profile");
  const [methodType, setMethodType] = useState("ach");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState(null);
  const [profileErrorMessage, setProfileErrorMessage] = useState("");
  const [profileSuccessMessage, setProfileSuccessMessage] = useState("");
  const [organization, setOrganization] = useState({
    org_name: "",
    org_street: "",
    org_city: "",
    org_state: "",
    org_zip: "",
    org_phone: "",
  });
  const [isLoadingOrganization, setIsLoadingOrganization] = useState(false);
  const [isSavingOrganization, setIsSavingOrganization] = useState(false);
  const [organizationError, setOrganizationError] = useState("");
  const [organizationSuccess, setOrganizationSuccess] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState("");
  const [teamMemberActionError, setTeamMemberActionError] = useState("");
  const [updatingTeamMemberId, setUpdatingTeamMemberId] = useState(null);

  const displayedName = profile?.name ?? "";
  const initials = getInitials(displayedName, authUser?.email);
  const isOrganizationAdmin = profile?.role?.toLowerCase() === "admin";
  const canEditTeam = canManageTeam(profile?.role);

  useEffect(() => {
    // Load organization details only when their tab is opened.
    if (activeTab !== "Organization") return undefined;

    let isMounted = true;
    async function loadOrganization() {
      setIsLoadingOrganization(true);
      setOrganizationError("");
      setOrganizationSuccess("");

      try {
        const { data, error } = await supabase.functions.invoke(
          "organization-settings",
          { method: "GET" },
        );
        if (error) {
          throw await getFunctionError(
            error,
            "Could not load organization settings.",
          );
        }

        const currentOrganization = data?.data;
        if (!currentOrganization) {
          throw new Error(
            "Your account is not linked to an organization. Contact an administrator.",
          );
        }
        if (isMounted) {
          setOrganization({
            org_name: currentOrganization.name ?? "",
            org_street: currentOrganization.street ?? "",
            org_city: currentOrganization.city ?? "",
            org_state: currentOrganization.state ?? "",
            org_zip: currentOrganization.zip ?? "",
            org_phone: currentOrganization.phone ?? "",
          });
        }
      } catch (error) {
        if (isMounted) {
          setOrganizationError(
            error instanceof Error
              ? error.message
              : "Could not load organization settings.",
          );
        }
      } finally {
        if (isMounted) setIsLoadingOrganization(false);
      }
    }

    void loadOrganization();
    return () => {
      // Avoid updating state if the user leaves the tab before the request completes.
      isMounted = false;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "Team & Roles") return undefined;

    let isMounted = true;
    async function loadTeamMembers() {
      setIsLoadingTeamMembers(true);
      setTeamMembersError("");

      try {
        const { data, error } = await supabase.functions.invoke(
          "team-members",
          { method: "GET" },
        );
        if (error) {
          throw await getFunctionError(error, "Could not load team members.");
        }
        if (!Array.isArray(data?.members)) {
          throw new Error("The server returned an invalid team member list.");
        }

        if (isMounted) setTeamMembers(data.members);
      } catch (error) {
        if (isMounted) {
          setTeamMembersError(
            error instanceof Error ? error.message : "Could not load team members.",
          );
        }
      } finally {
        if (isMounted) setIsLoadingTeamMembers(false);
      }
    }

    void loadTeamMembers();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  async function handleSaveProfile(event) {
    event.preventDefault();
    setProfileErrorMessage("");
    setProfileSuccessMessage("");
    const trimmedName = (name ?? profile?.name ?? "").trim();
    if (!trimmedName) {
      setProfileErrorMessage("Enter your full name.");
      return;
    }

    setIsUpdating(true);
    try {
      // The provider updates shared state too, so the sidebar reflects the saved name immediately.
      await updateProfileName(trimmedName);
      setName(null);
      setProfileSuccessMessage("Your profile has been updated.");
    } catch (error) {
      setProfileErrorMessage(
        error instanceof Error ? error.message : "Could not update your profile.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSaveOrganization(event) {
    event.preventDefault();
    setOrganizationError("");
    setOrganizationSuccess("");

    // This is a UI guard; the Edge Function/database also enforce admin permission.
    if (!isOrganizationAdmin) {
      setOrganizationError("Only organization admins can update these details.");
      return;
    }

    const name = organization.org_name.trim();
    if (!name) {
      setOrganizationError("Organization name is required.");
      return;
    }

    setIsSavingOrganization(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "organization-settings",
        {
          method: "PATCH",
          body: {
            name,
            street: organization.org_street,
            city: organization.org_city,
            state: organization.org_state,
            zip: organization.org_zip,
            phone: organization.org_phone,
          },
        },
      );
      if (error) {
        throw await getFunctionError(
          error,
          "Could not save organization details.",
        );
      }

      const updatedOrganization = data?.data;
      if (!updatedOrganization) {
        throw new Error("The server did not return the saved organization.");
      }

      setOrganization({
        org_name: updatedOrganization.name ?? "",
        org_street: updatedOrganization.street ?? "",
        org_city: updatedOrganization.city ?? "",
        org_state: updatedOrganization.state ?? "",
        org_zip: updatedOrganization.zip ?? "",
        org_phone: updatedOrganization.phone ?? "",
      });
      setOrganizationSuccess("Organization details saved.");
    } catch (error) {
      setOrganizationError(
        error instanceof Error
          ? error.message
          : "Could not save organization details.",
      );
    } finally {
      setIsSavingOrganization(false);
    }
  }

  async function handleToggleTeamMemberStatus(member) {
    const nextStatus = member.status === "active" ? "inactive" : "active";
    setTeamMemberActionError("");
    setUpdatingTeamMemberId(member.id);

    try {
      const { data, error } = await supabase.functions.invoke("team-members", {
        method: "PATCH",
        body: { userId: member.id, status: nextStatus },
      });
      if (error) {
        throw await getFunctionError(error, "Could not update member status.");
      }
      if (!Array.isArray(data?.members)) {
        throw new Error("The server did not return the updated team list.");
      }

      setTeamMembers(data.members);
    } catch (error) {
      setTeamMemberActionError(
        error instanceof Error ? error.message : "Could not update member status.",
      );
    } finally {
      setUpdatingTeamMemberId(null);
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    setIsUpdating(true);
  
    // Re-authenticate with the current password before accepting a new one.
    const { data: { user } } = await supabase.auth.getUser();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwords.current_password,
    })

    if (signInError) {
      setPasswordError(
        "Current password entry is incorrect. Please try again."
      );
      setIsUpdating(false);
      return;
    }

    // Don't update Auth credentials unless both new-password fields agree.
    if (passwords.new_password !== passwords.confirm_new_password) {
      setPasswordError(
        "New password and Confirm new password fields do not match. Please try again."
      );
      setIsUpdating(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: passwords.new_password,
      current_password: passwords.current_password,
    });

    if (updateError) {
      setPasswordError(updateError.message);
    } else {
      setPasswordSuccess("Your password has been updated.");
      setPasswords({ current_password: "", new_password: "", confirm_new_password: ""});
    }

    setIsUpdating(false);
  }

  return (
    <>
      <section>
        <h1 className="font-serif text-2xl font-bold">Account Settings</h1>
        <p className="mt-2 text-sm">
          Manage your profile, organization, payment methods, and team.
        </p>
      </section>

      {/* Only the selected tab's form is rendered. */}
      <nav
        aria-label="Account settings sections"
        className="mt-6 flex flex-wrap gap-2 border-b border-secondary pb-4"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            aria-pressed={activeTab === tab}
            className={`${
              activeTab === tab ? "btn-primary" : "btn-secondary"
            } px-4 py-2 text-xs`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Profile: name can be changed here; email and role are display-only. */}
      {activeTab === "Profile" && (
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
                showPasswordForm ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
              inert={!showPasswordForm}
            >
              <div className="overflow-hidden">
                <form onSubmit={handleUpdatePassword} className="mt-4">
                  <div className="grid grid-cols-1 gap-4 md:w-1/2">
                    {passwordFields.map(({ label, id, autoComplete, placeholder }) => (
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
                            setPasswords({...passwords, [id]: e.target.value})
                          }
                          required
                          className={inputClass}
                        />
                      </div>
                    ))}
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
      )}

      {/* Organization: loaded and saved through the organization-settings Edge Function. */}
      {activeTab === "Organization" && (
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
      )}

      {/* Payment Methods: presentation-only until persistence is implemented. */}
      {activeTab === "Payment Methods" && (
        <>
          {/* Payment methods list — stacks into cards below md */}
          <section className="card mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
              <div>
                <h2 className="text-lg font-bold">Payment Methods</h2>
                <p className="mt-1 text-sm">
                  The accounts your organization pays bills from. Each vendor
                  account picks one of these.
                </p>
              </div>
              {isOrganizationAdmin && (
                <a href="#add-method" className="btn-primary px-5 py-3 text-sm">
                  + Add Payment Method
                </a>
              )}
            </div>

            {!isOrganizationAdmin && (
              <p className="mt-4 text-sm text-gray-600">
                Only organization admins can manage payment methods.
              </p>
            )}

            <table className="mt-4 w-full text-left text-sm">
              <thead className="hidden md:table-header-group">
                <tr className="text-xs uppercase">
                  {paymentColumns.map((col) => (
                    <th key={col.key} className="px-4 py-3 font-semibold">
                      {col.label}
                    </th>
                  ))}
                  {isOrganizationAdmin && (
                    <th className="px-4 py-3 text-right font-semibold">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="block md:table-row-group">
                {/* Placeholder row — replace with mapped payment method data later */}
                <tr className="mb-4 block rounded-lg bg-white p-4 md:mb-0 md:table-row md:bg-transparent md:p-0">
                  {paymentColumns.map((col) => (
                    <td
                      key={col.key}
                      className="flex justify-between py-1 md:table-cell md:px-4 md:py-4"
                    >
                      <span className="font-semibold md:hidden">
                        {col.label}
                      </span>
                      {col.key === "status" ? (
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                          Active
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  ))}
                  {isOrganizationAdmin && (
                    <td className="block pt-3 md:table-cell md:px-4 md:py-4">
                      <div className="flex gap-2 md:justify-end">
                        <button className="btn-secondary flex-1 px-4 py-2 text-xs md:flex-none">
                          Make Default
                        </button>
                        <button className="btn-secondary flex-1 px-4 py-2 text-xs md:flex-none">
                          Edit
                        </button>
                        <button className="btn-secondary flex-1 px-4 py-2 text-xs md:flex-none">
                          Remove
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              </tbody>
            </table>

            <p className="mt-4 text-xs">
              A method still used by vendor accounts can't be removed until
              those accounts are switched to another method.
            </p>
          </section>

          {/* Add payment method form */}
          {isOrganizationAdmin && (
            <section id="add-method" className="card mt-8">
            <h2 className="border-b border-black pb-4 text-lg font-bold">
              Add Payment Method
            </h2>

            <form onSubmit={(e) => e.preventDefault()} className="mt-4">
              <fieldset>
                <legend className="text-sm font-semibold">Type</legend>
                <div className="mt-2 flex flex-col gap-2 md:flex-row">
                  {methodTypes.map(({ label, key }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 rounded-lg border bg-white px-4 py-3 text-sm ${
                        methodType === key
                          ? "border-primary"
                          : "border-secondary"
                      }`}
                    >
                      <input
                        type="radio"
                        name="method_type"
                        value={key}
                        checked={methodType === key}
                        onChange={() => setMethodType(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {fieldsByType[methodType].map(({ label, id, placeholder }) => (
                  <div key={id}>
                    <label htmlFor={id} className="text-sm font-semibold">
                      {label}
                    </label>
                    <input
                      id={id}
                      type="text"
                      placeholder={placeholder}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>

              <label className="mt-6 flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_default" />
                Make this the default method
              </label>

              <button
                type="submit"
                className="btn-primary mt-6 px-5 py-3 text-sm"
              >
                Save Method
              </button>
            </form>
            </section>
          )}
        </>
      )}

      {/* Team & Roles: members load from the authenticated team-members Edge Function. */}
      {activeTab === "Team & Roles" && (
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
                  {isOrganizationAdmin && (
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
                      colSpan={teamColumns.length + (isOrganizationAdmin ? 1 : 0)}
                      className="px-4 py-4 text-center"
                    >
                      Loading team members...
                    </td>
                  </tr>
                )}
                {!isLoadingTeamMembers && teamMembersError && (
                  <tr className="border-t border-section">
                    <td
                      colSpan={teamColumns.length + (isOrganizationAdmin ? 1 : 0)}
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
                        colSpan={teamColumns.length + (isOrganizationAdmin ? 1 : 0)}
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
                                member.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-secondary text-gray-700"
                              }`}
                            >
                              {formatRole(member.status)}
                            </span>
                          ) : col.key === "role" ? (
                            formatRole(member.role)
                          ) : (
                            member[col.key] || "—"
                          )}
                        </td>
                      ))}
                      {isOrganizationAdmin && (
                        <td className="px-4 py-3 text-right">
                          {member.id === authUser?.id ? (
                            <span className="text-xs text-gray-500">
                              Your account
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn-secondary px-3 py-2 text-xs"
                              disabled={updatingTeamMemberId === member.id}
                              onClick={() => handleToggleTeamMemberStatus(member)}
                            >
                              {updatingTeamMemberId === member.id
                                ? "Saving..."
                                : member.status === "active"
                                  ? "Set inactive"
                                  : "Set active"}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>

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
      )}
    </>
  );
}

export default AccountSettingsPage;