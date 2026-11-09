//import { supabase } from '../utils/supabase'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BillsPage from "./pages/BillsPage";
import BillDetailsPage from "./pages/BillDetailsPage";
import UploadBillPage from "./pages/UploadBillPage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import ManualBillIntakePage from "./pages/ManualBillIntakePage";
import VendorsPage from "./pages/VendorsPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import FunctionTestPage from "./pages/FunctionTestPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import NotFoundPage from "./pages/NotFoundPage";
import AppLayout from "./components/AppLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages: no sidebar */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        {/* Logged-in pages share the sidebar + footer layout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bills" element={<BillsPage />} />
          <Route path="/bills/:billId" element={<BillDetailsPage />} />
          <Route path="/bills/upload" element={<UploadBillPage />} />
          <Route path="/bills/manual" element={<ManualBillIntakePage />} />
          {/* <Route path="/billintake" element={<BillIntakePage />} /> */}
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:propertyId" element={<PropertyDetailsPage />}/>
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/settings" element={<AccountSettingsPage />} />
          {/* Dev-only page for calling edge functions directly */}
          <Route path="/dev/functions" element={<FunctionTestPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
