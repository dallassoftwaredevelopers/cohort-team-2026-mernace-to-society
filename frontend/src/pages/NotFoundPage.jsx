import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-section px-6 text-center">
      <div className="max-w-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Error 404
        </p>
        <h1 className="mt-4 text-4xl font-bold text-sidebar sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 text-base text-gray-600">
          The page you’re looking for doesn’t exist or may have moved.
        </p>
        <Link
          to="/"
          className="btn-primary mt-8 inline-flex px-5 py-3 no-underline"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}

export default NotFoundPage;
