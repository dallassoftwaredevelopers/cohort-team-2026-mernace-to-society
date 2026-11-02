import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { useState } from "react";

const tabs = ["Profile", "Organization", "Payment Methods", "Team & Roles"];

const inputClass =
  "mt-1 w-full rounded-lg border border-secondary bg-white px-4 py-3 text-sm";

// ---------- Profile ----------
// Supabase `user` table: name, email, role; password is handled by Supabase Auth
const profileFields = [
  { label: "Full Name", id: "name", type: "text" },
  { label: "Email", id: "email", type: "email" },
];

const passwordFields = [
  { label: "New Password", id: "new_password" },
  { label: "Confirm New Password", id: "confirm_password" },
];

// ---------- Organization ----------
// no organization table in Supabase yet (user, property, and bill only store org_id)
const orgFields = [
  { label: "Organization Name", id: "org_name" },
  { label: "Street", id: "org_street" },
  { label: "City", id: "org_city" },
  { label: "State", id: "org_state" },
  { label: "Zip", id: "org_zip" },
  { label: "Phone", id: "org_phone" },
];

// ---------- Payment Methods ----------
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

// ---------- Team & Roles ----------
// Supabase `user` table; status is not a column yet (invited | active | disabled)
const teamColumns = [
  { label: "Name", key: "name", mobile: true },
  { label: "Email", key: "email" },
  { label: "Role", key: "role", mobile: true },
  { label: "Status", key: "status" },
];

const roleDescriptions = [
  {
    role: "Staff",
    note: "Can upload and enter bills, and view properties and vendors.",
  },
  {
    role: "Manager",
    note: "Everything staff can do, plus approve, reject, and mark bills paid.",
  },
  {
    role: "Admin",
    note: "Full access, including payment methods, team members, and settings.",
  },
];

const hideOnMobile = (col) => (col.mobile ? "" : "hidden md:table-cell");

function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [methodType, setMethodType] = useState("ach");

  return (
    <div className="flex min-h-screen bg-white text-black">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <section>
            <h1 className="font-serif text-2xl font-bold">Account Settings</h1>
            <p className="mt-2 text-sm">
              Manage your profile, organization, payment methods, and team.
            </p>
          </section>

          {/* Settings tabs */}
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

          {/* Profile */}
          {activeTab === "Profile" && (
            <>
              <section className="card mt-8">
                <h2 className="border-b border-black pb-4 text-lg font-bold">
                  Profile
                </h2>

                <form onSubmit={(e) => e.preventDefault()} className="mt-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-sidebar text-lg font-bold text-white"
                      aria-hidden="true"
                    >
                      RS
                    </div>
                    <div>
                      <p className="font-semibold">Robert Smith</p>
                      <p className="text-sm capitalize">admin</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {profileFields.map(({ label, id, type }) => (
                      <div key={id}>
                        <label htmlFor={id} className="text-sm font-semibold">
                          {label}
                        </label>
                        <input id={id} type={type} className={inputClass} />
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary mt-6 px-5 py-3 text-sm"
                  >
                    Save Profile
                  </button>
                </form>
              </section>

              <section className="card mt-8">
                <h2 className="border-b border-black pb-4 text-lg font-bold">
                  Change Password
                </h2>

                <form onSubmit={(e) => e.preventDefault()} className="mt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {passwordFields.map(({ label, id }) => (
                      <div key={id}>
                        <label htmlFor={id} className="text-sm font-semibold">
                          {label}
                        </label>
                        <input
                          id={id}
                          type="password"
                          autoComplete="new-password"
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary mt-6 px-5 py-3 text-sm"
                  >
                    Update Password
                  </button>
                </form>
              </section>
            </>
          )}

          {/* Organization */}
          {activeTab === "Organization" && (
            <section className="card mt-8">
              <h2 className="border-b border-black pb-4 text-lg font-bold">
                Organization
              </h2>

              <form onSubmit={(e) => e.preventDefault()} className="mt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {orgFields.map(({ label, id }) => (
                    <div key={id}>
                      <label htmlFor={id} className="text-sm font-semibold">
                        {label}
                      </label>
                      <input id={id} type="text" className={inputClass} />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn-primary mt-6 px-5 py-3 text-sm"
                >
                  Save Organization
                </button>
              </form>
            </section>
          )}

          {/* Payment Methods */}
          {activeTab === "Payment Methods" && (
            <>
              {/* Payment methods list — stacks into cards below md */}
              <section className="card mt-8">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
                  <div>
                    <h2 className="text-lg font-bold">Payment Methods</h2>
                    <p className="mt-1 text-sm">
                      The accounts your organization pays bills from. Each
                      vendor account picks one of these.
                    </p>
                  </div>
                  <a
                    href="#add-method"
                    className="btn-primary px-5 py-3 text-sm"
                  >
                    + Add Payment Method
                  </a>
                </div>

                <table className="mt-4 w-full text-left text-sm">
                  <thead className="hidden md:table-header-group">
                    <tr className="text-xs uppercase">
                      {paymentColumns.map((col) => (
                        <th key={col.key} className="px-4 py-3 font-semibold">
                          {col.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right font-semibold">
                        Actions
                      </th>
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
                    </tr>
                  </tbody>
                </table>

                <p className="mt-4 text-xs">
                  A method still used by vendor accounts can't be removed until
                  those accounts are switched to another method.
                </p>
              </section>

              {/* Add payment method form */}
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
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-4 py-3 text-sm ${
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
                    {fieldsByType[methodType].map(
                      ({ label, id, placeholder }) => (
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
                      ),
                    )}
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
            </>
          )}

          {/* Team & Roles */}
          {activeTab === "Team & Roles" && (
            <>
              <section className="card mt-8">
                <div className="border-b border-black pb-4">
                  <h2 className="text-lg font-bold">Team Members</h2>
                  <p className="mt-1 text-sm">
                    People in your organization and what they can do.
                  </p>
                </div>

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
                      <th className="px-4 py-3 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {/* Placeholder row — replace with mapped user data later */}
                    <tr className="border-t border-section">
                      {teamColumns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3 ${hideOnMobile(col)}`}
                        >
                          {col.key === "status" ? (
                            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                              Active
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button className="btn-secondary px-4 py-2 text-xs">
                          Edit
                        </button>
                      </td>
                    </tr>
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
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default AccountSettingsPage;
