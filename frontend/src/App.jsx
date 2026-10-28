import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import DashboardPage from "./pages/DashboardPage"
import BillIntakePage from "./pages/BillIntakePage"
import PropertiesPage from "./pages/PropertiesPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/billintake" element={<BillIntakePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
