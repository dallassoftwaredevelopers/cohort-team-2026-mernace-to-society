import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../../utils/supabase";

const UserProfileContext = createContext(null);

export function UserProfileProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile(user) {
      // Ignore older requests if an auth event starts a newer profile load.
      const currentRequestId = ++requestId.current;
      if (!isMounted) return;
      setAuthUser(user);
      setError("");

      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // The database function scopes the result to auth.uid().
        const { data, error: profileError } = await supabase.rpc(
          "get_current_user_profile",
        );
        const currentProfile = data?.[0] ?? null;

        if (!isMounted || currentRequestId !== requestId.current) return;
        if (profileError) {
          setProfile(null);
          setError(`Could not load your profile: ${profileError.message}`);
        } else if (!currentProfile) {
          setProfile(null);
          setError(
            "No app profile is linked to this account. Contact your administrator.",
          );
        } else {
          setProfile(currentProfile);
        }
      } catch (profileError) {
        if (!isMounted || currentRequestId !== requestId.current) return;
        setProfile(null);
        setError(
          `Could not load your profile: ${
            profileError instanceof Error
              ? profileError.message
              : "Unknown error"
          }`,
        );
      }
      setIsLoading(false);
    }

    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!isMounted) return;
      if (authError) {
        setError(`Could not verify your account: ${authError.message}`);
        setIsLoading(false);
        return;
      }
      void loadProfile(data.user);
    }).catch((authError) => {
      if (!isMounted) return;
      setError(
        `Could not verify your account: ${
          authError instanceof Error ? authError.message : "Unknown error"
        }`,
      );
      setIsLoading(false);
    });

    // Load on mount and refresh the profile when the auth session changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer the request so it runs after Supabase finishes its auth callback.
      setTimeout(() => {
        if (isMounted) void loadProfile(session?.user ?? null);
      }, 0);
    });

    return () => {
      isMounted = false;
      // Prevent callbacks after unmount.
      subscription.unsubscribe();
    };
  }, []);

  async function updateProfileName(name) {
    if (!profile?.id) {
      throw new Error("Your profile is not available to update.");
    }

    // The database function updates only the signed-in user's name.
    const { data, error: updateError } = await supabase.rpc(
      "update_current_user_name",
      { p_name: name },
    );

    if (updateError) throw updateError;
    const updatedProfile = data?.[0];
    if (!updatedProfile) {
      throw new Error("The server did not return your updated profile.");
    }
    setProfile(updatedProfile);
    setError("");
    return updatedProfile;
  }

  return (
    <UserProfileContext.Provider
      value={{
        authUser,
        profile,
        isLoading,
        error,
        updateProfileName,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

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
