import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../utils/supabase";

function ConfirmEmailPage() {
  const [confirmation] = useState(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    return {
      tokenHash: params.get("token_hash"),
      type: params.get("type"),
    };
  });
  const [status, setStatus] = useState("ready");
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    }
  }, []);

  async function handleConfirm() {
    if (!confirmation.tokenHash || confirmation.type !== "signup") {
      setErrorMessage("This confirmation link is invalid. Please request a new one.");
      return;
    }

    setStatus("confirming");
    setErrorMessage("");
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: confirmation.tokenHash,
        type: "signup",
      });
      if (error) {
        setErrorMessage("This confirmation link is invalid or has expired. Please request a new one.");
        setStatus("ready");
        return;
      }
      if (!data.user?.email_confirmed_at) {
        throw new Error("Email confirmation could not be verified. Please try again.");
      }
      setStatus("confirmed");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not verify your email. Please try again.");
      setStatus("ready");
    }
  }

  async function handleResend(event) {
    event.preventDefault();
    setResending(true);
    setErrorMessage("");
    setResendMessage("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/confirm-email` },
      });
      if (error && !["user_not_found", "email_exists", "user_already_exists"].includes(error.code)) {
        throw error;
      }
      setResendMessage("If a confirmation is needed, check your email for next steps.");
    } catch {
      setErrorMessage("Could not request a confirmation email. Please try again or contact your administrator.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-section px-6">
      <section className="w-full max-w-lg rounded-xl bg-white p-8 shadow-sm">
        <h1 className="font-serif text-2xl font-bold">
          {status === "confirmed" ? "Email verified" : "Verify your email"}
        </h1>
        {status === "confirmed" ? (
          <p role="status" className="mt-4 text-sm">
            Thanks for verifying your email. Contact your administrator to activate your account.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm">Confirm your email to verify your account.</p>
            {errorMessage && <p role="alert" className="mt-4 text-sm text-red-700">{errorMessage}</p>}
            <button type="button" className="btn-primary mt-6 px-5 py-3 text-sm disabled:opacity-50" onClick={handleConfirm} disabled={status === "confirming"}>
              {status === "confirming" ? "Verifying..." : "Confirm email"}
            </button>
            <form onSubmit={handleResend} className="mt-6 border-t border-secondary pt-6">
              <label htmlFor="confirmation-email" className="block text-sm font-semibold">Need a new confirmation email?</label>
              <input
                id="confirmation-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {resendMessage && <p role="status" className="mt-3 text-sm">{resendMessage}</p>}
              <button type="submit" className="btn-secondary mt-4 px-5 py-3 text-sm disabled:opacity-50" disabled={resending}>
                {resending ? "Sending..." : "Send confirmation email"}
              </button>
            </form>
          </>
        )}
        <Link to="/login" className="mt-6 block text-sm font-semibold text-primary hover:underline">
          Go to login
        </Link>
      </section>
    </main>
  );
}

export default ConfirmEmailPage;
