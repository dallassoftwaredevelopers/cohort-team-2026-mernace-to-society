import { useState } from "react";
import { supabase } from "../../utils/supabase";
import { Link, useLocation, useNavigate } from "react-router-dom";
import mainSplash from "../assets/billioMain.png";
import PasswordHint from "../components/PasswordHint";
import { PASSWORD_RULES_ERROR, passwordMeetsRules } from "../../utils/passwordRules";

const LOGIN_ERROR_MESSAGES = {
  invalid_credentials: "Incorrect email or password.",
  email_not_confirmed: "Please verify your email before logging in. Check your email for the link.",
  user_banned: "Your account access is inactive. Contact your organization's administrator for access.",
  over_request_rate_limit: "Too many attempts. Please wait a few minutes and try again.",
};

const LoginPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] =useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inputClassName =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  async function handleSubmit(event){
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      let result;
      if (isSignUp) {
        const trimmedName = name.trim();
        if (!trimmedName) {
          setErrorMessage("Enter your full name.");
          return;
        }

        if (!passwordMeetsRules(password)) {
          setErrorMessage(PASSWORD_RULES_ERROR);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match.");
          return;
        }

        result = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/confirm-email`,
            data: {
              name: trimmedName,
            },
          },
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      }

      const { data, error } = result;
      if (isSignUp && ["user_already_exists", "email_exists", "user_banned"].includes(error?.code)) {
        setInfoMessage("Check your email for next steps.");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      if (error) {
        if (isSignUp) {
          setErrorMessage(
            error.code === "weak_password"
              ? PASSWORD_RULES_ERROR
              : "Could not complete signup. Please try again or contact your administrator.",
          );
          return;
        }

        setErrorMessage(
          LOGIN_ERROR_MESSAGES[error.code] ?? "Could not log in. Please try again."
        );
        return;
      }

      if (isSignUp && !data.user) {
        setErrorMessage("Could not create your account. Please try again.");
        return;
      }

      if (isSignUp) {
        if (data.session) {
          setErrorMessage("Email confirmation is not configured. Contact your administrator.");
          return;
        }
        setInfoMessage("Check your email for next steps.");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      const destination = location.state?.from;
      navigate(
        destination
          ? `${destination.pathname}${destination.search ?? ""}${destination.hash ?? ""}`
          : "/dashboard",
        { replace: true },
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(
        isSignUp
          ? "Could not complete signup. Please try again or contact your administrator."
          : "Could not log in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleToggleMode() {
    setIsSignUp(!isSignUp);
    setPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setInfoMessage("");
  }

  let logInSignUpSubmitButtonLabel;
  if (isSignUp){
    if (isSubmitting) {
      logInSignUpSubmitButtonLabel = "Creating account";
    } else {
      logInSignUpSubmitButtonLabel = "Create account";
    }
  } else {
    if (isSubmitting) {
      logInSignUpSubmitButtonLabel = "Logging in";
    } else {
      logInSignUpSubmitButtonLabel = "Log in";
    }
  }

  return (
    <div className="flex justify-center align-center min-h-screen bg-section w-full">
      <main className="flex justify-center items-start min-w-0 max-h-3/4 p-6 bg-section w-full">
        <div className="flex min-w-0 flex-col justify-center bg-section w-1/2 max-w-80 px-4">
          
          <img src={mainSplash} 
          alt="It's logo that says billio with an image above it of a wooden house with three stacks of coins that get progressively larger. Each stack has a plant growing out the top and the background is blue." 
          className="flex-auto object-contain" 
          /> 
          
          <p className="mt-6 font-sans max-w-xs text-center text-md text-sidebar-200">
            Track and pay every invoice for every property in one place.
          </p>
          <p className="mt-6 max-w-xs font-serif text-center text-lg text-[#245bc4]">
            Less management.
          </p>
          <p className="mt-1 max-w-xs font-serif text-center text-lg text-[#245bc4]">
            More property.
          </p>

        </div>
        <div className="flex min-h-screen items-start justify-center bg-section px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
            <h1 className="mt-1 text-2xl font-bold font-serif text-gray-900">
              {isSignUp ? "Create Account" : "Log In"}
            </h1>
            <p className="mt-1 font-sans text-sm text-gray-600">
              {isSignUp ? "Welcome to Billio! Enter your information below to create your new account." : "Welcome back! Enter your details below."}
            </p>
            <form onSubmit={handleSubmit} className="mt-6 font-sans space-y-4">
              {isSignUp && (
                <div>
                  <label htmlFor="full-name" className="mb-1 block text-sm font-medium text-gray-700">
                    Full name
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={150}
                    placeholder="Your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputClassName}
                  />
                </div>
              )}
              <div>  
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
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
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                placeholder={isSignUp ? "Create strong password" : "Enter your password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClassName}
              />

              {isSignUp && (
                <div>
                  <label 
                    htmlFor="confirm-password"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                      Confirm password
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
              )}
              
              {isSignUp && <PasswordHint password={password} />}
              
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

              <button 
                type="submit"
                disabled={isSubmitting}
                className="btn-primary font-sans w-full py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                  {logInSignUpSubmitButtonLabel}
              </button>

            </form>

            <p className="mt-2 text-sm text-gray-600">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}

              <button
                type="button"
                onClick={handleToggleMode}
                className="font-semibold text-primary hover:underline"
              >
                {isSignUp ? "Log in" : "Sign up"}
              </button>

            </p>
            
            {!isSignUp && (
              <Link
                to="/forgot-password"
                state={{ email, from: "/login" }}
                className="block mt-2 text-sm font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
