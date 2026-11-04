
import { Link, NavLink } from "react-router-dom"

const navigationItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/bills", label: "All Bills" },
  { to: "/properties", label: "Properties" },
  { to: "/vendors", label: "Vendors" },
  { to: "/approvals", label: "Approvals" },
]

const navigationClassName = ({ isActive }) =>
  `block rounded-lg px-4 py-3 transition ${
    isActive
      ? "bg-[#2861C5] font-medium text-white"
      : "text-slate-100 hover:bg-[#2B405D]"
  }`

function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-[#2B405D] bg-[#192D4A] px-5 py-6">
      <h1 className="mb-10 text-2xl font-bold text-white">Billio</h1>

      <nav className="flex flex-1 flex-col gap-2">
        {navigationItems.map(({ to, label }) => (
          <NavLink key={to} to={to} className={navigationClassName}>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[#2B405D] pt-5">
        <Link
          to="/settings"
          className="mb-5 block rounded-lg px-4 py-3 text-slate-100 transition hover:bg-[#2B405D]"
        >
          Account Settings
        </Link>

        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8A9BB6] font-semibold text-[#192D4A]">
            RS
          </div>

          <div>
            <p className="text-sm font-medium text-white">Robert Smith</p>
            <p className="text-xs text-slate-300">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
