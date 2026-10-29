//import { supabase } from '../utils/supabase'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import DashboardPage from "./pages/DashboardPage"
import BillsPage from "./pages/BillsPage"
import UploadBillPage from "./pages/UploadBillPage"
import PropertiesPage from "./pages/PropertiesPage"
import ManualBillIntakePage from "./pages/ManualBillIntakePage"
import VendorsPage from "./pages/VendorsPage"
import TermsOfServicePage from "./pages/TermsOfServicePage"
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage"
import FunctionTestPage from "./pages/FunctionTestPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/bills/upload" element={<UploadBillPage />} />
        <Route path="/bills/manual" element={<ManualBillIntakePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        {/* Dev-only page for calling edge functions directly */}
        <Route path="/dev/functions" element={<FunctionTestPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
