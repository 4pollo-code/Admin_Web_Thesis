import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/userManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import ResultsPage from "./pages/resultsPage"

import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} /> 
        <Route path="/results-page" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} /> 
      </Routes>
    </BrowserRouter>
  );
}
