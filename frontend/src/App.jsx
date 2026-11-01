//import { supabase } from '../utils/supabase'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BillsPage from "./pages/BillsPage";
import UploadBillPage from "./pages/UploadBillPage";
import PropertiesPage from "./pages/PropertiesPage";
import ManualBillIntakePage from "./pages/ManualBillIntakePage";
import VendorsPage from "./pages/VendorsPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import FunctionTestPage from "./pages/FunctionTestPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/billintake" element={<BillIntakePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
