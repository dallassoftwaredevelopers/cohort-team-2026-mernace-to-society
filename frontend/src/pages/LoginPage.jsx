import { useState } from "react";
import { supabase } from "../../utils/supabase";
import { useNavigate } from "react-router-dom";
import mainSplash from "../assets/billioMain.png";

const LoginPage = () => {
  const [email, setEmail] =useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const inputClassName =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  async function handleSubmit(event){
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    navigate("/dashboard");
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
              Login to Billio
            </h1>
            <p className="mt-1 font-sans text-sm text-gray-600">
              Welcome back! Enter your details below.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 font-sans space-y-4">
              <div>  
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClassName}
                />
              </div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClassName}
              />
              
              
              {errorMessage && (
                <p role="alert" className="rounded-md font-sans bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </p>
              )}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="btn-primary font-sans w-full py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                  {isSubmitting ? "Logging in" : "Log in"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
