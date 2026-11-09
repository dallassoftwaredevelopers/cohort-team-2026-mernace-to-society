import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-5 text-sm text-gray-600 md:px-8">
      <nav aria-label="Footer">
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 sm:justify-end">
          <li>
            <Link
              to="/terms-of-service"
              className="hover:text-primary hover:underline"
            >
              Terms of Service
            </Link>
          </li>
          <li>
            <Link
              to="/privacy-policy"
              className="hover:text-primary hover:underline"
            >
              Privacy Policy
            </Link>
          </li>
        </ul>
      </nav>
    </footer>
  );
}

export default Footer;
