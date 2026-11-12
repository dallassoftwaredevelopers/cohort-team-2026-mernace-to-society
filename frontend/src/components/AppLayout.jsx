import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { UserProfileProvider } from "../hooks/useUserProfile";

// Shared shell for every logged-in page: sidebar + page content + footer.
// Pages render inside <Outlet /> and only return their own content.
function AppLayout() {
  return (
    <UserProfileProvider>
      <div className="flex min-h-screen bg-white text-black">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* pt-[4.5rem] leaves room for the fixed mobile top bar (h-14) */}
          <main className="min-w-0 flex-1 px-4 pb-8 pt-[4.5rem] md:p-8">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </UserProfileProvider>
  );
}

export default AppLayout;
