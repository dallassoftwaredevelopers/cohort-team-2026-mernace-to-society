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
  });

  useEffect(() => {
    let isMounted = true;
    let authEventReceived = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      if (isMounted) {
        setAuthState({
          isLoading: false,
          user: session?.user ?? null,
          error: "",
        });
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted || authEventReceived) return;
        setAuthState({
          isLoading: false,
          user: data.session?.user ?? null,
          error: error?.message ?? "",
        });
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

  return children;
}

export default RequireAuth;
