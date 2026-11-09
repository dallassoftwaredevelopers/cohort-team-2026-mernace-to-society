import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import billioLogo from "../assets/billioLogo.png";
import Footer from "../components/Footer";
import { supabase } from "../../utils/supabase";

const lastUpdated = "November 8, 2026";

const sections = [
  {
    id: "acceptance",
    title: "Accepting these terms",
    body: [
      "By creating an account or using Billio, you agree to these Terms of Service. If you use Billio on behalf of a company or property management organization, you agree to them for that organization too.",
      "If you don't agree, please don't use Billio.",
    ],
  },
  {
    id: "service",
    title: "What Billio does",
    body: [
      "Billio helps property managers collect utility and service bills, match them to properties and vendors, route them for approval, and pay them.",
      "You can connect your organization's own bank accounts or cards to Billio and use them to pay approved bills.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts and roles",
    body: [
      "You're responsible for keeping your login details private and for everything that happens under your account. Tell your organization's admin right away if you think someone else has access to it.",
      "Your organization's admin decides each person's role. Staff can upload and enter bills, managers can approve or reject them, and admins can manage settings and team members.",
    ],
  },
  {
    id: "ai",
    title: "AI bill extraction",
    body: [
      "When you upload a bill, Billio uses AI to read details such as the vendor, amount, and due date. AI can make mistakes.",
      "You are responsible for reviewing and confirming every extracted detail before a bill is approved or paid. Billio is not responsible for losses caused by bills approved without that review.",
    ],
  },
  {
    id: "payments",
    title: "Payments",
    body: [
      "When you connect a bank account or card, the payment details are handled by our third-party payment processor. Billio does not store full bank account or card numbers.",
      "Only people with the right role can approve and send payments. By sending a payment through Billio, you authorize us and our payment processor to charge the connected account for that amount.",
      "You're responsible for making sure the connected account has enough funds, that payment details are correct, and that each bill is approved before it's paid. Payments may take a few business days to reach the vendor, and a payment that has already been sent may not be reversible.",
      "If a payment fails, we'll show it in Billio so you can retry it or pay another way. Your bank or card issuer may charge its own fees.",
    ],
  },
  {
    id: "data",
    title: "Your data",
    body: [
      "You own the bills, documents, and information you put into Billio. You give us permission to store and process them only so we can run the service for you.",
      "Each organization can only see its own properties, vendors, and bills. Please only add payment details through Billio's payment settings, not inside uploaded files or notes. See our Privacy Policy for how we handle your information.",
    ],
    link: { to: "/privacy-policy", label: "Read the Privacy Policy" },
  },
  {
    id: "use",
    title: "Acceptable use",
    body: [
      "Don't use Billio to break the law, upload files you don't have the right to share, try to access another organization's data, or interfere with how the service runs.",
      "We may suspend accounts that break these rules.",
    ],
  },
  {
    id: "third-party",
    title: "Third-party services",
    body: [
      "Billio relies on outside providers for hosting, storage, sign-in, AI processing, and payment processing. Their services have their own terms, and we're not responsible for outages or changes on their side.",
    ],
  },
  {
    id: "availability",
    title: "Availability and changes",
    body: [
      "Billio is provided as is and as available. We work to keep it running, but we can't promise it will always be available or error-free.",
      "We may update features or these terms. If we make an important change, we'll let you know in the app or by email, and the date at the top of this page will change.",
    ],
  },
  {
    id: "liability",
    title: "Limits on liability",
    body: [
      "To the extent the law allows, Billio is not liable for indirect losses, late fees, or lost data that result from using the service, including payments delayed or declined by a bank, card issuer, or payment processor.",
      "You remain responsible for approving the right amounts, paying your bills on time, and keeping your own records accurate.",
    ],
  },
  {
    id: "ending",
    title: "Ending your account",
    body: [
      "You can stop using Billio at any time. Your organization's admin can ask us to close the account and delete its data.",
      "We may close accounts that break these terms or stay inactive for a long time, and we'll try to give notice first.",
    ],
  },
  {
    id: "contact",
    title: "Contact us",
    body: ["Questions about these terms? Email us at support@billio.app."],
  },
];

function TermsOfServicePage() {
  // null = still checking, true/false once Supabase answers
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    // Check for an existing session when the page loads
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
    });

    // Update the button if the user logs in or out while on the page
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(Boolean(session));
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-sidebar/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <Link to="/" className="flex items-center">
            <img
              src={billioLogo}
              alt="Billio home"
              className="-my-6 h-20 w-auto md:h-24"
            />
          </Link>
          {/* Logged in: Go to dashboard. Logged out: Log in. Nothing while checking, so it doesn't flicker */}
          {isLoggedIn === true && (
            <Link to="/dashboard" className="btn-primary px-4 py-2 text-sm">
              Go to dashboard
            </Link>
          )}
          {isLoggedIn === false && (
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white hover:bg-sidebar-hover"
            >
              Log in
            </Link>
          )}
        </div>
      </header>

      {/* Title band */}
      <section className="bg-sidebar">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
          <Link
            to="/"
            className="text-sm font-semibold text-blue-300 hover:text-white hover:underline"
          >
            &larr; Back to home
          </Link>
          <h1 className="mt-4 font-serif text-4xl font-bold text-white md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-slate-300">Last updated {lastUpdated}</p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-16">
          {/* Table of contents: sticky on desktop, a simple list on phones */}
          <nav
            aria-label="On this page"
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              On this page
            </p>
            <ol className="mt-4 space-y-2 border-l border-secondary text-sm">
              {sections.map(({ id, title }, index) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="-ml-px block border-l-2 border-transparent py-1 pl-4 text-gray-600 hover:border-primary hover:text-primary"
                  >
                    {index + 1}. {title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="min-w-0 max-w-3xl">
            <div className="mt-10 space-y-12">
              {sections.map(({ id, title, body, link }, index) => (
                <section key={id} id={id} className="scroll-mt-24">
                  <h2 className="font-serif text-2xl font-bold text-sidebar">
                    <span className="mr-2 text-primary">{index + 1}.</span>
                    {title}
                  </h2>
                  <div className="mt-4 space-y-4 leading-7 text-gray-700">
                    {body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {link && (
                    <Link
                      to={link.to}
                      className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
                    >
                      {link.label} &rarr;
                    </Link>
                  )}
                </section>
              ))}
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default TermsOfServicePage;
