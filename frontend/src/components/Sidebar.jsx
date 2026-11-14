import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import {
  formatRole,
  getInitials,
  useUserProfile,
} from "../hooks/useUserProfile";
import billioLogo from "../assets/billio-dark.png";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/bills", label: "All Bills" },
  { to: "/properties", label: "Properties" },
  { to: "/vendors", label: "Vendors" },
  { to: "/approvals", label: "Approvals" },
];

const linkClassName =
  "block rounded-lg px-4 py-3 text-slate-100 transition hover:bg-sidebar-hover";

const navigationClassName = ({ isActive }) =>
  isActive
    ? "block rounded-lg bg-primary px-4 py-3 font-medium text-white"
    : linkClassName;

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { authUser, profile } = useUserProfile();
  const closeMenu = () => setIsOpen(false);
  const displayName =
    profile?.name || authUser?.user_metadata?.full_name || authUser?.email || "Account";
  const initials = getInitials(profile?.name, authUser?.email);

  // Close on Escape and stop the page behind the drawer from scrolling
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <>
      {/* Mobile top bar: hidden from md up */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-sidebar px-4 md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          aria-expanded={isOpen}
          aria-controls="app-sidebar"
          className="rounded-lg p-2 text-white hover:bg-sidebar-hover"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/dashboard" className="flex items-center">
          <img src={billioLogo} alt="Billio dashboard" className="h-8 w-auto" />
        </Link>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-avatar text-xs font-semibold text-sidebar"
          aria-hidden="true"
        >
          {initials}
        </span>
      </header>

      {/* Backdrop behind the open drawer on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: slide-in drawer on mobile, static column from md up */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto bg-sidebar px-5 py-6 transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:sticky md:top-0 md:h-screen md:max-h-screen md:min-h-0 md:shrink-0 md:translate-x-0`}
      >
        <div className="mb-10 flex items-center justify-between">
          <Link
            to="/dashboard"
            onClick={closeMenu}
            className="flex items-center"
          >
            <img
              src={billioLogo}
              alt="Billio dashboard"
              className="h-10 w-auto"
            />
          </Link>
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close menu"
            className="rounded-lg p-2 text-2xl leading-none text-white hover:bg-sidebar-hover md:hidden"
          >
            &times;
          </button>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex flex-1 flex-col gap-2"
        >
          {navigationItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMenu}
              className={navigationClassName}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-hover pt-5">
          <Link
            to="/settings"
            onClick={closeMenu}
            className={`mb-5 ${linkClassName}`}
          >
            Account Settings
          </Link>

          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-avatar font-semibold text-sidebar">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-slate-300">
                {formatRole(profile?.role)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className={`mt-5 w-full text-left ${linkClassName}`}
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
