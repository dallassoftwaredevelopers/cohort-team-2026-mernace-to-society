import { createContext, useContext } from "react";

// Filled in by components/UserProfileProvider.jsx
export const UserProfileContext = createContext(null);

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    // Fail loudly when a consumer is rendered outside the shared provider.
    throw new Error("useUserProfile must be used within UserProfileProvider.");
  }
  return context;
}

export function getInitials(name, email = "") {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length > 0) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }
  return email.trim().slice(0, 1).toUpperCase() || "?";
}

export function formatRole(role) {
  if (!role) return "Role unavailable";
  return role.charAt(0).toUpperCase() + role.slice(1);
}
