import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import billioLogo from "../assets/billioLogo.png";
import Footer from "../components/Footer";
import { supabase } from "../../utils/supabase";

const lastUpdated = "November 8, 2026";

const sections = [
  {
    id: "overview",
    title: "Overview",
    body: [
      "This Privacy Policy explains what information Billio collects, how we use it, and the choices you have. It applies to the Billio website and app.",
      "Billio is built for property management teams. Your organization controls the account, so some requests (like deleting your organization's data) go through your organization's admin.",
    ],
  },
  {
    id: "collect",
    title: "Information we collect",
    body: [
      "Account details: your name, email address, role (staff, manager, or admin), and the organization you belong to. Your password is handled by our sign-in provider, and we never see it.",
      "Bills and documents: the PDFs and photos you upload, and the details read from them, such as vendor, invoice number, amount, and due dates.",
      "Property and vendor records: property names and addresses, vendor names and accounts, and the approval decisions and notes your team adds.",
      "Technical information: basic logs such as your browser type, device, and when you signed in, which help us keep Billio secure and working.",
    ],
  },
  {
    id: "use",
    title: "How we use your information",
    body: [
      "We use your information to run Billio: storing your bills, matching them to properties and vendors, routing them for approval, processing payments you send, and showing your team's history.",
      "We also use it to keep accounts secure, fix problems, and contact you about important changes to the service. We don't sell your personal information.",
    ],
  },
  {
    id: "ai",
    title: "AI bill extraction",
    body: [
      "When you upload a bill, the document is sent to an AI provider so it can read the bill's details. The extracted details are saved to your account for you to review and confirm.",
      "We only send the documents needed to extract bill details, and we don't use your bills to advertise to you.",
    ],
  },
  {
    id: "payments",
    title: "Payment information",
    body: [
      "When you connect a bank account or card, the full account or card number goes directly to our third-party payment processor. Billio does not store full bank account or card numbers.",
      "Billio keeps only what it needs to show your payment methods and history, such as a nickname, the payment type, the last four digits, and the status of each payment.",
    ],
    link: { to: "/terms-of-service", label: "Read the Terms of Service" },
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: [
      "Your organization: people in your organization can see its properties, vendors, and bills based on their role. Other organizations can't see your data.",
      "Service providers: we use trusted providers for hosting, database storage, sign-in, AI processing, and payment processing. They only use your information to provide their service to us.",
      "Legal reasons: we may share information if the law requires it, or to protect the safety and security of Billio and its users.",
    ],
  },
  {
    id: "storage",
    title: "Cookies and browser storage",
    body: [
      "Billio stores your sign-in session in your browser so you stay logged in between visits. Logging out removes it.",
      "We don't use advertising cookies.",
    ],
  },
  {
    id: "security",
    title: "How we protect it",
    body: [
      "Data is encrypted while it travels between your browser and our servers, access to each organization's data is limited by role, and payment details stay with our payment processor.",
      "No system is perfectly secure. If we learn of a security issue that affects your information, we'll let you know.",
    ],
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: [
      "We keep your information for as long as your organization's account is active, so your bill and payment history stays available.",
      "If your organization closes its account, we delete or anonymize its data within a reasonable time, unless the law requires us to keep certain records longer.",
    ],
  },
  {
    id: "choices",
    title: "Your choices",
    body: [
      "You can update your name and email in Account Settings. You can ask us for a copy of your information, or ask us to correct or delete it.",
      "Some data belongs to your organization, such as bills and approval history. For those requests, we may need to work with your organization's admin.",
    ],
  },
  {
    id: "children",
    title: "Children",
    body: [
      "Billio is a business tool and isn't meant for anyone under 18. We don't knowingly collect information from children.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: [
      "If we make an important change to this policy, we'll let you know in the app or by email, and the date at the top of this page will change.",
    ],
  },
  {
    id: "contact",
    title: "Contact us",
    body: ["Questions about your privacy? Email us at privacy@billio.app."],
  },
];

function PrivacyPolicyPage() {
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
      {/* Top bar matches the landing page */}
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
            Privacy Policy
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

export default PrivacyPolicyPage;
