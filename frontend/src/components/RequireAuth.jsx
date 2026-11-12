import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../../utils/supabase";

function RequireAuth({ children }) {
  const location = useLocation();
  const [retryCount, setRetryCount] = useState(0);
  const [authState, setAuthState] = useState({
    isLoading: true,
    user: null,
    error: "",
    status: null,
  });
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    let isMounted = true;
    let authEventReceived = false;
    let accessCheckId = 0;

    async function checkUserAccess(user) {
      const currentCheckId = ++accessCheckId;
      if (!user) {
        if (isMounted) {
          setAuthState({
            isLoading: false,
            user: null,
            error: "",
            status: null,
          });
        }
        return;
      }

      if (isMounted) {
        setAuthState({
          isLoading: true,
          user,
          error: "",
          status: null,
        });
      }

      try {
        const { data: status, error } = await supabase.rpc(
          "get_current_user_status",
        );
        if (error) throw error;
        if (!isMounted || currentCheckId !== accessCheckId) return;

        setAuthState({
          isLoading: false,
          user,
          error: "",
          status,
        });
      } catch (error) {
        if (!isMounted || currentCheckId !== accessCheckId) return;
        setAuthState({
          isLoading: false,
          user,
          error:
            error instanceof Error
              ? error.message
              : "Could not verify your account status.",
          status: null,
        });
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      setTimeout(() => {
        if (isMounted) void checkUserAccess(session?.user ?? null);
      }, 0);
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted || authEventReceived) return;
        if (error) throw error;
        void checkUserAccess(data.session?.user ?? null);
      })
      .catch((error) => {
        if (!isMounted || authEventReceived) return;
        setAuthState({
          isLoading: false,
          user: null,
          error:
            error instanceof Error
              ? error.message
              : "Could not verify your session.",
          status: null,
        });
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [retryCount]);

  if (authState.isLoading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center text-sm text-gray-600"
        role="status"
      >
        Checking your session…
      </main>
    );
  }

  if (authState.error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <p role="alert" className="text-sm text-red-700">
          Could not verify your session: {authState.error}
        </p>
        <button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="btn-primary mt-4 px-4 py-2 text-sm"
        >
          Try again
        </button>
      </main>
    );
  }

  if (!authState.user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (authState.status !== "active") {
    const isInactive = authState.status === "inactive";
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-2xl font-bold">
          {isInactive ? "Account inactive" : "Account access unavailable"}
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          {isInactive
            ? "Your account is inactive. Contact an organization admin to restore access."
            : "Your account does not have an active team profile. Contact an organization admin."}
        </p>
        {signOutError && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {signOutError}
          </p>
        )}
        <button
          type="button"
          disabled={authState.isLoading}
          onClick={async () => {
            setSignOutError("");
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                setSignOutError(`Could not log out: ${error.message}`);
              }
            } catch (error) {
              setSignOutError(
                `Could not log out: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
              );
            }
          }}
          className="btn-secondary mt-5 px-4 py-2 text-sm"
        >
          Log out
        </button>
      </main>
    );
  }

  return children;
}

export default RequireAuth;
