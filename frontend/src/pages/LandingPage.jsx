import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import billioLogo from "../assets/billioLogo.png";
import Footer from "../components/Footer";

// Shared page width and side padding for every section
const container = "mx-auto max-w-6xl px-4 md:px-8";

const serviceTypes = [
  "Electric",
  "Water",
  "Disposal",
  "Internet",
  "Property Services",
];

const heroProof = [
  "Works on any device",
  "Role-based approvals",
  "Full approval history",
];

const productFacts = [
  { value: "5", label: "bill types, from electric to disposal" },
  { value: "4", label: "approval stages, from pending to rejected" },
  { value: "3", label: "team roles: staff, manager, admin" },
  { value: "1", label: "dashboard for every property" },
];

const oldWay = [
  "Bills scattered across email, mail, and vendor portals",
  "Retyping amounts and due dates into spreadsheets",
  "Chasing managers for sign-off by email",
  "Late fees from bills nobody saw",
  "Rebuilding who paid what at month-end",
];

const billioWay = [
  "Every bill in one queue, however it arrives",
  "AI reads the invoice for you",
  "A clear approval queue with the right people",
  "Due dates tracked across every property",
  "A full history behind every payment",
];

const steps = [
  {
    title: "Upload",
    description: "Drop in a PDF or photo, or enter it by hand.",
  },
  {
    title: "Review",
    description: "Check what Billio extracted and fix anything.",
  },
  { title: "Approve", description: "A manager signs off with one click." },
  { title: "Pay", description: "Mark it paid and keep the full history." },
];

const audiences = [
  {
    title: "Property managers",
    description:
      "Run every property's bills from one dashboard instead of five inboxes.",
  },
  {
    title: "Owners and investors",
    description: "See exactly what each property costs to run, bill by bill.",
  },
  {
    title: "Accounting teams",
    description:
      "Get approved, organized bills with a clear trail behind every payment.",
  },
];

const faqs = [
  {
    question: "What kinds of bills can Billio handle?",
    answer:
      "Any utility or service bill: electric, water, disposal, internet, and property services. Upload a PDF or image, or type the details in yourself.",
  },
  {
    question: "Do I still review what the AI extracts?",
    answer:
      "Yes. Billio fills in the details, and you confirm or correct them before a bill goes to approval.",
  },
  {
    question: "Who can approve bills?",
    answer:
      "Managers and admins. Staff can upload and enter bills, but they can't approve or reject them.",
  },
  {
    question: "Does it work on my phone?",
    answer:
      "Yes. Billio works on phones, tablets, and desktops, so you can approve a bill from anywhere.",
  },
];

const previewBills = [
  {
    vendor: "City Water",
    property: "Oak Street Apts",
    amount: "$412.80",
    status: "Pending",
  },
  {
    vendor: "Metro Electric",
    property: "Pine Plaza",
    amount: "$1,086.15",
    status: "Needs Review",
  },
  {
    vendor: "GreenWay Disposal",
    property: "Oak Street Apts",
    amount: "$165.00",
    status: "Approved",
  },
];

const statusStyles = {
  Pending: "bg-secondary text-black",
  "Needs Review": "bg-amber-100 text-amber-900",
  Approved: "bg-green-100 text-green-800",
};

const extractedFields = [
  ["Vendor", "City Water"],
  ["Invoice #", "CW-20814"],
  ["Amount", "$412.80"],
  ["Due date", "Nov 28"],
  ["Property", "Oak Street Apts"],
];

const propertySpend = [
  { name: "Oak Street Apts", percent: 82, amount: "$2,140" },
  { name: "Pine Plaza", percent: 64, amount: "$1,665" },
  { name: "Maple Court", percent: 41, amount: "$1,070" },
  { name: "Harbor Lofts", percent: 27, amount: "$705" },
];

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(
    () =>
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

const floatKeyframes = `
@keyframes billio-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
`;

function Eyebrow({ children, light = false }) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.2em] ${
        light ? "text-blue-300" : "text-primary"
      }`}
    >
      {children}
    </p>
  );
}

function SectionHeading({ id, eyebrow, children, subtitle, light = false }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {eyebrow && <Eyebrow light={light}>{eyebrow}</Eyebrow>}
      <h2
        id={id}
        className={`mt-3 text-balance font-serif text-3xl font-bold md:text-5xl ${
          light ? "text-white" : "text-sidebar"
        }`}
      >
        {children}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-lg ${light ? "text-slate-300" : "text-gray-600"}`}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}

function MockCard({ title, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl bg-white p-5 text-black shadow-2xl ring-1 ring-black/5 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-secondary pb-3">
        <p className="font-semibold">{title}</p>
        <span className="text-[11px] uppercase tracking-wide text-gray-500">
          Example
        </span>
      </div>
      {children}
    </div>
  );
}

// ---------- Illustrations ----------

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Back card: tilted dashboard stats, hidden on phones to keep it clean */}
      <div className="absolute -right-6 -top-8 hidden w-64 rotate-6 rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur md:block">
        <p className="text-xs text-slate-300">Outstanding this month</p>
        <p className="mt-1 text-3xl font-bold text-white">$5,580</p>
        <div className="mt-3 flex h-12 items-end gap-1.5">
          {[40, 65, 50, 80, 55, 90, 70].map((height, index) => (
            <span
              key={index}
              className="flex-1 rounded-sm bg-blue-300/70"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>

      {/* Front card: approval queue */}
      <MockCard title="Approval Queue" className="relative">
        <ul className="mt-3 space-y-3">
          {previewBills.map(({ vendor, property, amount, status }) => (
            <li
              key={vendor}
              className="flex items-center justify-between gap-3 rounded-lg bg-section p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{vendor}</p>
                <p className="truncate text-xs text-gray-600">{property}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">{amount}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyles[status]}`}
                >
                  {status}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <span className="btn-secondary flex-1 py-2 text-center text-xs">
            Reject
          </span>
          <span className="btn-primary flex-1 py-2 text-center text-xs">
            Approve
          </span>
        </div>
      </MockCard>

      {/* Floating chips */}
      <div className="absolute -left-4 -top-5 rounded-full bg-primary motion-safe:[animation:billio-float_5s_ease-in-out_infinite] px-4 py-2 text-xs font-semibold text-white shadow-lg md:-left-10">
        ✦ Extracted from PDF
      </div>
      <div className="absolute -bottom-5 -right-2 flex motion-safe:[animation:billio-float_6s_ease-in-out_1s_infinite] items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs shadow-xl ring-1 ring-black/5 md:-right-8">
        <span
          className="h-2.5 w-2.5 rounded-full bg-amber-500"
          aria-hidden="true"
        />
        <span>
          <strong>Metro Electric</strong> due in 3 days
        </span>
      </div>
    </div>
  );
}

// A paper bill turning into structured fields: the core of what Billio does
function ExtractionVisual() {
  return (
    <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
      {/* The paper bill */}
      <div className="mx-auto w-full max-w-xs -rotate-2 rounded-lg bg-white p-6 shadow-xl ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <p className="font-serif text-lg font-bold text-sidebar">
            City Water
          </p>
          <span className="text-[10px] uppercase text-gray-500">Statement</span>
        </div>
        <div className="mt-4 space-y-2" aria-hidden="true">
          <div className="h-2 w-3/4 rounded bg-gray-200" />
          <div className="h-2 w-1/2 rounded bg-gray-200" />
          <div className="h-2 w-2/3 rounded bg-gray-200" />
        </div>
        <div className="mt-6 rounded-md bg-section p-3">
          <p className="text-[10px] uppercase text-gray-500">Amount due</p>
          <p className="text-2xl font-bold">$412.80</p>
          <p className="text-[11px] text-gray-500">
            Due Nov 28 · Acct CW-20814
          </p>
        </div>
        <div className="mt-4 space-y-2" aria-hidden="true">
          <div className="h-2 w-full rounded bg-gray-100" />
          <div className="h-2 w-5/6 rounded bg-gray-100" />
        </div>
      </div>

      {/* Arrow */}
      <div
        className="mx-auto flex h-12 w-12 rotate-90 items-center justify-center rounded-full bg-primary text-xl text-white shadow-lg md:rotate-0"
        aria-hidden="true"
      >
        →
      </div>

      {/* The extracted fields */}
      <MockCard title="Bill details" className="mx-auto w-full max-w-xs">
        <dl className="mt-3 space-y-2">
          {extractedFields.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 rounded-lg bg-section px-3 py-2 text-sm"
            >
              <dt className="text-gray-500">{label}</dt>
              <dd className="flex items-center gap-2 font-semibold">
                {value}
                <span className="text-xs text-green-600" aria-hidden="true">
                  ✓
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </MockCard>
    </div>
  );
}

function MatchingVisual() {
  return (
    <MockCard title="Vendor match">
      <p className="mt-4 text-xs uppercase tracking-wide text-gray-500">
        Names found on bills
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {["ConEd", "Con Edison", "CONSOL. EDISON"].map((alias) => (
          <span
            key={alias}
            className="rounded-full bg-section px-3 py-1 text-xs font-semibold"
          >
            {alias}
          </span>
        ))}
      </div>
      <p className="my-3 text-center text-primary" aria-hidden="true">
        ↓
      </p>
      <div className="rounded-lg bg-primary/10 p-3">
        <p className="font-semibold text-primary">Consolidated Edison</p>
        <p className="text-xs text-gray-600">Electric · Oak Street Apts</p>
      </div>
    </MockCard>
  );
}

function ApprovalVisual() {
  return (
    <MockCard title="Approvals">
      <div className="mt-4 flex flex-wrap gap-2">
        {["Pending", "Needs Review", "Approved", "Rejected"].map(
          (tab, index) => (
            <span
              key={tab}
              className={`${
                index === 0 ? "btn-primary" : "btn-secondary"
              } px-3 py-1.5 text-[11px]`}
            >
              {tab}
            </span>
          ),
        )}
      </div>
      <div className="mt-4 rounded-lg bg-section p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">City Water · $412.80</p>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">
            Pending
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-600">
          Oak Street Apts · Due Nov 28
        </p>
      </div>
      <div className="mt-3 rounded-lg border border-dashed border-secondary p-3 text-xs text-gray-600">
        <strong className="text-black">History:</strong> Approved by Jordan
        (Manager) · "Matches last month's usage"
      </div>
    </MockCard>
  );
}

function SpendVisual() {
  return (
    <MockCard title="Spend by property">
      <ul className="mt-4 space-y-4">
        {propertySpend.map(({ name, percent, amount }) => (
          <li key={name}>
            <div className="flex justify-between text-sm">
              <span>{name}</span>
              <span className="font-semibold">{amount}</span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-section">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${percent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </MockCard>
  );
}

const featureRows = [
  {
    eyebrow: "Smart matching",
    title: "Every bill lands on the right property",
    description:
      "Vendors print their names a dozen ways. Billio links each variation to the right vendor and account, so bills file themselves.",
    points: [
      "Groups vendors by service type",
      "Flags bills that need a second look",
    ],
    Visual: MatchingVisual,
  },
  {
    eyebrow: "Approvals",
    title: "Sign-offs that don't get lost in email",
    description:
      "Bills wait in a clear queue until the right person approves them. Every decision is saved with who made it and why.",
    points: [
      "Only managers and admins can approve",
      "Rejections require a written reason",
    ],
    Visual: ApprovalVisual,
  },
  {
    eyebrow: "Payment tracking",
    title: "Know what every property costs to run",
    description:
      "See paid, outstanding, and due-soon totals for each property, without building a single spreadsheet.",
    points: ["Totals per property", "Outstanding and paid at a glance"],
    Visual: SpendVisual,
  },
];

// ---------- Page ----------

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      {/* Sticky top bar: stays visible while scrolling, slightly see-through */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-sidebar/90 backdrop-blur">
        <div className={`${container} flex items-center justify-between py-4`}>
          <Link to="/" className="flex items-center">
            <img
              src={billioLogo}
              alt="Billio home"
              className="-my-6 h-20 w-auto md:h-24"
            />
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            {[
              ["#features", "Features"],
              ["#how-it-works", "How it works"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-sidebar-hover hover:text-white focus-visible:outline-2 focus-visible:outline-blue-300 md:inline-block"
              >
                {label}
              </a>
            ))}
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white hover:bg-sidebar-hover"
            >
              Log in
            </Link>
            <Link to="/login" className="btn-primary px-4 py-2 text-sm">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <style>{floatKeyframes}</style>

      <main className="flex-1">
        {/* Hero: navy with a dot grid and a blue glow */}
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden bg-sidebar"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:22px_22px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary opacity-40 blur-3xl"
            aria-hidden="true"
          />

          <div
            className={`${container} relative grid items-center gap-16 pb-24 pt-10 md:grid-cols-2 md:pb-32 md:pt-16`}
          >
            <Reveal className="text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-200 ring-1 ring-white/20">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-300" />
                </span>
                AI-powered bill processing
              </span>
              <h1
                id="hero-title"
                className="mt-6 font-serif text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl"
              >
                Less management.
                <br />
                <span className="bg-gradient-to-r from-blue-200 via-blue-300 to-sky-400 bg-clip-text text-transparent">
                  More property.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-md text-lg text-slate-300 md:mx-0">
                Billio reads every utility bill, matches it to the right
                property, routes it for approval, and tracks it to payment. You
                get your week back.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
                <Link
                  to="/login"
                  className="btn-primary px-7 py-4 text-center text-sm shadow-lg shadow-primary/40 transition hover:-translate-y-0.5 hover:shadow-xl motion-reduce:hover:translate-y-0"
                >
                  Get started →
                </Link>
                <a
                  href="#how-it-works"
                  className="rounded-lg px-7 py-4 text-center text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-sidebar-hover"
                >
                  See how it works
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-300 md:justify-start">
                {heroProof.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-blue-300" aria-hidden="true">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={150}>
              <div aria-hidden="true">
                <HeroVisual />
              </div>
            </Reveal>
            <p className="sr-only">
              Example of the Billio approval queue showing three bills.
            </p>
          </div>
        </section>

        {/* Service type strip */}
        <section
          aria-label="Bill types Billio handles"
          className="border-b border-secondary"
        >
          <div
            className={`${container} flex flex-wrap items-center justify-center gap-3 py-6`}
          >
            <span className="text-sm text-gray-500">
              Handles every bill type:
            </span>
            {serviceTypes.map((type) => (
              <span
                key={type}
                className="rounded-full bg-section px-4 py-1.5 text-sm font-semibold text-sidebar"
              >
                {type}
              </span>
            ))}
          </div>
        </section>

        {/* Old way vs Billio */}
        <section
          aria-labelledby="compare-title"
          className={`${container} py-20 md:py-28`}
        >
          <SectionHeading
            id="compare-title"
            eyebrow="Sound familiar?"
            subtitle="Utility bills are the busywork of property management. They shouldn't take half your week."
          >
            Stop running bills out of your inbox
          </SectionHeading>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <Reveal className="rounded-2xl border border-secondary bg-section p-8">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                The old way
              </h3>
              <ul className="mt-6 space-y-4">
                {oldWay.map((item) => (
                  <li key={item} className="flex gap-3 text-gray-600">
                    <span className="font-bold text-red-500" aria-hidden="true">
                      ✕
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal
              delay={150}
              className="relative overflow-hidden rounded-2xl bg-primary p-8 text-white shadow-xl shadow-primary/30"
            >
              <div
                className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-100">
                With Billio
              </h3>
              <ul className="relative mt-6 space-y-4">
                {billioWay.map((item) => (
                  <li key={item} className="flex gap-3 font-medium">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-primary"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* Signature moment: a bill becomes data */}
        <section
          id="features"
          aria-labelledby="extract-title"
          className="scroll-mt-4 bg-section"
        >
          <div className={`${container} py-20 md:py-28`}>
            <SectionHeading
              id="extract-title"
              eyebrow="AI bill intake"
              subtitle="Upload a PDF or a photo. Billio pulls out the vendor, amount, due date, and account, then you confirm it."
            >
              Watch a bill turn into data
            </SectionHeading>
            <Reveal className="mt-16">
              <div aria-hidden="true">
                <ExtractionVisual />
              </div>
              <p className="sr-only">
                Example of a water bill and the details Billio extracts from it.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Feature rows, alternating sides */}
        <section
          aria-label="Features"
          className={`${container} space-y-24 py-20 md:py-28`}
        >
          {featureRows.map(
            ({ eyebrow, title, description, points, Visual }, index) => (
              <div
                key={title}
                className="grid items-center gap-10 md:grid-cols-2 md:gap-16"
              >
                <Reveal className={index % 2 === 1 ? "md:order-2" : ""}>
                  <Eyebrow>{eyebrow}</Eyebrow>
                  <h3 className="mt-3 text-balance font-serif text-3xl font-bold text-sidebar md:text-4xl">
                    {title}
                  </h3>
                  <p className="mt-4 text-lg text-gray-600">{description}</p>
                  <ul className="mt-6 space-y-3">
                    {points.map((point) => (
                      <li key={point} className="flex gap-3">
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </Reveal>
                <Reveal
                  delay={150}
                  className="relative transition-transform duration-300 hover:-translate-y-1 motion-reduce:hover:translate-y-0"
                >
                  <div
                    className="pointer-events-none absolute inset-6 -z-10 rounded-3xl bg-primary/15 blur-2xl"
                    aria-hidden="true"
                  />
                  <div aria-hidden="true">
                    <Visual />
                  </div>
                </Reveal>
              </div>
            ),
          )}
        </section>

        {/* Product facts band */}
        <section
          aria-label="Billio at a glance"
          className="border-y border-secondary bg-section"
        >
          <div
            className={`${container} grid grid-cols-2 gap-8 py-14 lg:grid-cols-4`}
          >
            {productFacts.map(({ value, label }, index) => (
              <Reveal key={label} delay={index * 100} className="text-center">
                <p>
                  <span className="block font-serif text-5xl font-bold text-primary md:text-6xl">
                    {value}
                  </span>
                  <span className="mx-auto mt-2 block max-w-[12rem] text-sm text-gray-600">
                    {label}
                  </span>
                </p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works: numbered steps joined by a line */}
        <section
          id="how-it-works"
          aria-labelledby="steps-title"
          className="scroll-mt-4 bg-sidebar"
        >
          <div className={`${container} py-20 md:py-28`}>
            <SectionHeading id="steps-title" eyebrow="How it works" light>
              From upload to paid in four steps
            </SectionHeading>

            <ol className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div
                className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-px bg-white/20 lg:block"
                aria-hidden="true"
              />
              {steps.map(({ title, description }, index) => (
                <li key={title} className="relative text-center">
                  <span
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white ring-8 ring-sidebar"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-white">
                    {title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-[14rem] text-sm text-slate-300">
                    {description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Who it's for */}
        <section
          aria-labelledby="audience-title"
          className={`${container} py-20 md:py-28`}
        >
          <SectionHeading
            id="audience-title"
            eyebrow="Built for your whole team"
          >
            One place for everyone who touches a bill
          </SectionHeading>

          <ul className="mt-14 grid gap-6 md:grid-cols-3">
            {audiences.map(({ title, description }) => (
              <li
                key={title}
                className="group rounded-2xl border border-secondary p-8 transition hover:-translate-y-1 hover:border-primary hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <span
                  className="block h-1 w-10 rounded-full bg-primary transition-all group-hover:w-16"
                  aria-hidden="true"
                />
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-gray-600">{description}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ: native <details> opens and closes without any JavaScript */}
        <section
          id="faq"
          aria-labelledby="faq-title"
          className="scroll-mt-4 bg-section"
        >
          <div className="mx-auto max-w-3xl px-4 py-20 md:px-8 md:py-28">
            <SectionHeading id="faq-title" eyebrow="FAQ">
              Questions, answered
            </SectionHeading>

            <div className="mt-12 space-y-3">
              {faqs.map(({ question, answer }) => (
                <details
                  key={question}
                  className="group rounded-xl bg-white p-5 ring-1 ring-black/5 open:shadow-md"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {question}
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg text-primary transition-transform group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-gray-700">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;
