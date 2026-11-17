import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import PasswordHint from "../components/PasswordHint";
import { PASSWORD_RULES_ERROR, passwordMeetsRules } from "../../utils/passwordRules";

//Keep in sync with TOML key max_frequency in supabase/config.toml
const RESEND_COOLDOWN_SECONDS = 60;

const BACK_LINKS = {
    "/login": "Back to login",
    "/settings": "Back to account settings",
    "/": "Back to home",
};
const DEFAULT_BACK_PATH = "/"

const inputClassName = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function ForgotPasswordPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [step, setStep] = useState("email");
    const [email, setEmail] = useState(location.state?.email ?? "");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [infoMessage, setInfoMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const from = location.state?.from;
    const backPath = from in BACK_LINKS ? from : DEFAULT_BACK_PATH;
    const backLabel = BACK_LINKS[backPath];

    // Ticks resend countdown down once per second
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    async function handleSendCode(event) {
        event?.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");
        setInfoMessage("");

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        setIsSubmitting(false);

        if (error) {
            setErrorMessage(error.message);
            return;
        }

        setInfoMessage(`If an account exists for ${email.trim()}, we sent a 6-digit code.`);
        setStep("code");
        setCooldown(RESEND_COOLDOWN_SECONDS);

    }

    async function handleVerifyCode(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        const { error } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: code.trim(),
            type: "recovery",
        });

        setIsSubmitting(false);

        if (error) {
            setErrorMessage("That code is invalid or has expired. Check the email or request a new one.");
            return;
        }

        setInfoMessage("");
        setStep("password");

    }

    function handleUseDifferentEmail() {
        setStep("email");
        setCode("");
        setErrorMessage("");
        setInfoMessage("");
    }

    async function handleSetPassword(event) {
        event.preventDefault();
        setErrorMessage("");

        if (!passwordMeetsRules(newPassword)) {
            setErrorMessage(PASSWORD_RULES_ERROR);
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match.")
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setIsSubmitting(false);
            setErrorMessage(error.message);
            return;
        }

        //log out of account on all other devices
        await supabase.auth.signOut({ scope: "others" });

        navigate(backPath === "/settings" ? "/settings" : "/dashboard", { replace: true, state: { passwordReset: true } });
    }

    return (
        <div className="flex min-h-screen justify-center bg-section px-4 pt-16">
            <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm h-fit">
                <h1 className="text-2xl font-bold font-serif text-gray-900">
                    Reset password
                </h1>

                {step === "email" && (
                    <form 
                        onSubmit={handleSendCode} 
                        className="mt-6 space-y-4"
                    >
                        <div>
                            <label 
                                htmlFor="email"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                autoComplete="username"
                                required
                                placeholder="you@example.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className={inputClassName}
                            />

                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary font-sans w-full py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Sending..." : "Send code"}
                        </button>
                    
                    </form> 
                )}

                {step === "code" && (
                    <form 
                        onSubmit={handleVerifyCode} 
                        className="mt-6 space-y-4"
                    >
                        
                        <div>
                            <label
                                htmlFor="code"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                6-digit code
                            </label>
                            <input
                                id="code"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                className={inputClassName}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || code.length !== 6}
                            className="btn-primary font-sans w-full py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Verifying..." : "Verify code"}
                        </button>
                        <div className="flex justify-between gap-2">
                            <button
                                type="button"
                                disabled={cooldown > 0 || isSubmitting}
                                onClick={() => handleSendCode()}
                                className="text-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            >   
                                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                            </button>

                            <button
                                type="button"
                                onClick={handleUseDifferentEmail}
                                className="text-sm font-semibold text-primary hover:underline"
                            >
                                Use different email
                            </button>
                        </div>
                    </form>
                )}

                {step === "password" && (
                    <form onSubmit={handleSetPassword} className="mt-6 space-y-4">

                        <div>
                            <label
                                htmlFor="new-password"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                New password
                            </label>

                            <input
                                id="new-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                placeholder="Create strong password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={inputClassName}
                            />
                        </div>

                        <div>
                            <label 
                                htmlFor="confirm-password"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Confirm new password
                            </label>

                            <input
                                id="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputClassName}
                            />

                        </div>

                        <PasswordHint password={newPassword} />

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary font-sans w-full py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Saving..." : "Set new password"}
                        </button>

                    </form>
                )}

                {errorMessage && (
                    <p role="alert" className="rounded-md font-sans bg-red-50 px-3 py-2 text-sm text-red-700">
                        {errorMessage}
                    </p>
                )}

                {infoMessage && (
                    <p role="status" className="rounded-md font-sans bg-green-50 px-3 py-2 text-sm text-green-700">
                    {infoMessage}
                    </p>
                )}

                {step !== "password" && (
                    <Link 
                        to={backPath}
                        className="mt-4 block text-sm text-primary hover:underline"
                    >
                    
                        {backLabel}

                    </Link>
                )}

            </div>
        </div>
    );
}

export default ForgotPasswordPage;


