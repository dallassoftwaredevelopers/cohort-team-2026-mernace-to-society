import ProfileSettings from "../components/ProfileSettings";
import OrganizationSettings from "../components/OrganizationSettings";
import PaymentMethodsSettings from "../components/PaymentMethodsSettings";
import TeamRolesSettings from "../components/TeamRolesSettings";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import {
  formatRole,
  getInitials,
  useUserProfile,
} from "../hooks/useUserProfile";

const tabs = ["Profile", "Organization", "Payment Methods", "Team & Roles"];

const inputClass = "input";

// Edge Function errors include the server response body with the user-facing message.
async function getFunctionError(error, fallback) {
  const responseBody = await error?.context?.json?.().catch(() => null);
  return new Error(responseBody?.error ?? error?.message ?? fallback);
}

// Password changes use Supabase Auth; name and role are stored in the app profile.
const passwordFields = [
  {
    label: "Current Password",
    id: "current_password",
    autoComplete: "current-password",
    placeholder: "Enter your current password",
  },
  {
    label: "New Password",
    id: "new_password",
    autoComplete: "new-password",
    placeholder: "Enter a new password",
  },
  {
    label: "Confirm New Password",
    id: "confirm_new_password",
    autoComplete: "new-password",
    placeholder: "Re-enter your new password",
  },
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

const teamColumns = [
  { label: "Name", key: "name", mobile: true },
  { label: "Email", key: "email" },
  { label: "Role", key: "role", mobile: true },
  { label: "Status", key: "status", mobile: true },
];

const roleDescriptions = [
  {
    role: "Staff",
    note: "Can upload and view bills, properties, and vendors, but cannot edit records.",
  },
  {
    role: "Manager",
    note: "Can edit bills, properties, and vendors, and handle bill approvals.",
  },
  {
    role: "Admin",
    note: "Can edit bills, properties, and vendors, manage team members, and update organization settings.",
  },
];

const hideOnMobile = (col) => (col.mobile ? "" : "hidden md:table-cell");

function AccountSettingsPage() {
  const {
    authUser,
    profile,
    isLoading: isProfileLoading,
    error: profileError,
    updateProfileName,
  } = useUserProfile();

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
  const [teamMemberSuccess, setTeamMemberSuccess] = useState("");
  const [teamDrafts, setTeamDrafts] = useState({});
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [showTeamReview, setShowTeamReview] = useState(false);

  const displayedName = profile?.name ?? "";
  const initials = getInitials(displayedName, authUser?.email);
  const isOrganizationAdmin = profile?.role?.toLowerCase() === "admin";
  const canEditTeam = isOrganizationAdmin;
  const pendingTeamChanges = teamMembers.flatMap((member) => {
    const draft = teamDrafts[member.id];
    if (!draft) return [];
    const changes = {};
    if (draft.role !== undefined && draft.role !== member.role?.toLowerCase()) {
      changes.role = draft.role;
    }
    if (draft.status !== undefined && draft.status !== member.status) {
      changes.status = draft.status;
    }
    return Object.keys(changes).length ? [{ member, changes }] : [];
  });

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
            error instanceof Error
              ? error.message
              : "Could not load team members.",
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
        error instanceof Error
          ? error.message
          : "Could not update your profile.",
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
      setOrganizationError(
        "Only organization admins can update these details.",
      );
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

  function updateTeamDraft(member, changes) {
    setTeamMemberActionError("");
    setTeamMemberSuccess("");
    setTeamDrafts((current) => ({
      ...current,
      [member.id]: { ...current[member.id], ...changes },
    }));
  }

  async function handleConfirmTeamChanges() {
    setTeamMemberActionError("");
    setTeamMemberSuccess("");
    setIsSavingTeam(true);
    let completed = 0;
    try {
      for (const { member, changes } of pendingTeamChanges) {
        const { data, error } = await supabase.functions.invoke(
          "team-members",
          {
            method: "PATCH",
            body: { userId: member.id, ...changes },
          },
        );
        if (error) {
          const cause = await getFunctionError(
            error,
            "Could not update team member.",
          );
          throw new Error(`${member.name || member.email}: ${cause.message}`);
        }
        if (!Array.isArray(data?.members)) {
          throw new Error(
            "The server did not return the updated team list. Reload before retrying.",
          );
        }

        setTeamMembers(data.members);
        setTeamDrafts((current) => {
          const next = { ...current };
          delete next[member.id];
          return next;
        });
        completed += 1;
      }
      setShowTeamReview(false);
      setTeamMemberSuccess("Team changes saved.");
    } catch (error) {
      setTeamMemberActionError(
        `${completed ? `${completed} member update(s) saved. ` : ""}${error instanceof Error ? error.message : "Could not update team members."} Check remaining changes before retrying; the last update may have been applied.`,
      );
    } finally {
      setIsSavingTeam(false);
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    setIsUpdating(true);

    // Re-authenticate with the current password before accepting a new one.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwords.current_password,
    });

    if (signInError) {
      setPasswordError(
        "Current password entry is incorrect. Please try again.",
      );
      setIsUpdating(false);
      return;
    }

    // Don't update Auth credentials unless both new-password fields agree.
    if (passwords.new_password !== passwords.confirm_new_password) {
      setPasswordError(
        "New password and Confirm new password fields do not match. Please try again.",
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
      setPasswords({
        current_password: "",
        new_password: "",
        confirm_new_password: "",
      });
    }

    setIsUpdating(false);
  }

  return (
    <>
      <section>
        <h1 className="page-title">Account Settings</h1>
        <p className="page-subtitle">
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
            disabled={isSavingTeam}
            aria-pressed={activeTab === tab}
            className={`${
              activeTab === tab ? "btn-primary" : "btn-secondary"
            } px-4 py-2 text-xs`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Profile" && (
        <ProfileSettings
          handleSaveProfile={handleSaveProfile}
          initials={initials}
          displayedName={displayedName}
          authUser={authUser}
          profile={profile}
          profileError={profileError}
          profileErrorMessage={profileErrorMessage}
          profileSuccessMessage={profileSuccessMessage}
          name={name}
          setName={setName}
          setProfileErrorMessage={setProfileErrorMessage}
          setProfileSuccessMessage={setProfileSuccessMessage}
          isProfileLoading={isProfileLoading}
          isUpdating={isUpdating}
          showPasswordForm={showPasswordForm}
          setShowPasswordForm={setShowPasswordForm}
          handleUpdatePassword={handleUpdatePassword}
          passwordFields={passwordFields}
          passwords={passwords}
          setPasswords={setPasswords}
          passwordError={passwordError}
          passwordSuccess={passwordSuccess}
          inputClass={inputClass}
          formatRole={formatRole}
        />
      )}

      {activeTab === "Organization" && (
        <OrganizationSettings
          handleSaveOrganization={handleSaveOrganization}
          orgFields={orgFields}
          organization={organization}
          setOrganization={setOrganization}
          setOrganizationError={setOrganizationError}
          setOrganizationSuccess={setOrganizationSuccess}
          isLoadingOrganization={isLoadingOrganization}
          isOrganizationAdmin={isOrganizationAdmin}
          organizationError={organizationError}
          organizationSuccess={organizationSuccess}
          isSavingOrganization={isSavingOrganization}
          inputClass={inputClass}
        />
      )}

      {activeTab === "Payment Methods" && (
        <PaymentMethodsSettings
          isOrganizationAdmin={isOrganizationAdmin}
          paymentColumns={paymentColumns}
          methodTypes={methodTypes}
          methodType={methodType}
          setMethodType={setMethodType}
          fieldsByType={fieldsByType}
          inputClass={inputClass}
        />
      )}

      {activeTab === "Team & Roles" && (
        <TeamRolesSettings
          teamMemberActionError={teamMemberActionError}
          teamMemberSuccess={teamMemberSuccess}
          teamColumns={teamColumns}
          hideOnMobile={hideOnMobile}
          canEditTeam={canEditTeam}
          isLoadingTeamMembers={isLoadingTeamMembers}
          teamMembersError={teamMembersError}
          teamMembers={teamMembers}
          formatRole={formatRole}
          authUser={authUser}
          teamDrafts={teamDrafts}
          updateTeamDraft={updateTeamDraft}
          pendingTeamChanges={pendingTeamChanges}
          showTeamReview={showTeamReview}
          setShowTeamReview={setShowTeamReview}
          isSavingTeam={isSavingTeam}
          handleConfirmTeamChanges={handleConfirmTeamChanges}
          roleDescriptions={roleDescriptions}
        />
      )}
    </>
  );
}

export default AccountSettingsPage;
