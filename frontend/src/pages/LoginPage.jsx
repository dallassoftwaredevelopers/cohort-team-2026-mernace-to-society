import { useState } from "react";
import { supabase } from "../../utils/supabase";
import { useLocation, useNavigate } from "react-router-dom";
import mainSplash from "../assets/billioMain.png";

const LoginPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] =useState("");
  const [password, setPassword] = useState("");
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

    let result;
    if (isSignUp) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setErrorMessage("Enter your full name.");
        setIsSubmitting(false);
        return;
      }

      result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: trimmedName,
          },
        },
      });
    } else {
      result = await supabase.auth.signInWithPassword ({
        email: email,
        password: password,
      })
    }

    const { data, error } = result;
    setIsSubmitting(false);

    const accountAlreadyExists = 
      isSignUp && (error?.code === "user_already_exists" || 
      (!error && data.user && data.user.identifies?.length === 0));

    if (accountAlreadyExists) {
      setErrorMessage("An Account with this email already exists. Please log in instead.");
      setIsSignUp(false);
      setPassword("");
      return;
    }

    if (error) {
      const isBannedAccount =
        error.code === "user_banned" ||
        error.message?.toLowerCase().includes("banned");
      setErrorMessage(
        isBannedAccount
          ? "Your account access is inactive. Contact your organization administrator for access."
          : error.message,
      );
      return;
    }

    if (isSignUp && !data.session) {
      setInfoMessage("Account created! Check your email to confirm it, then log in.");
      return;
    }

    const destination = location.state?.from;
    navigate(
      destination
        ? `${destination.pathname}${destination.search ?? ""}${destination.hash ?? ""}`
        : "/dashboard",
      { replace: true },
    );
  }

  function handleToggleMode() {
    setIsSignUp(!isSignUp);
    setPassword("");
    setErrorMessage("");
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
                className="cursor-pointer btn-primary font-sans w-full py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                  {logInSignUpSubmitButtonLabel}
              </button>
            </form>
            <button
              type="button"
              onClick={handleToggleMode}
              className="mt-2 cursor-pointer text-sm font-semibold text-primary hover:underline "
            >
              {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
