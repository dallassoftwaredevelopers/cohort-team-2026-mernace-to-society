import { useState, useEffect } from 'react'
//import { supabase } from '../utils/supabase'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import DashboardPage from "./pages/DashboardPage"
import PropertiesPage from "./pages/PropertiesPage"
import BillIntake from "./pages/BillIntake"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/bills/new" element={<BillIntake />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

