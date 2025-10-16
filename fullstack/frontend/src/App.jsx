import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/userManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import ResultsPage from "./pages/resultsPage"
import CourseManagement from "./pages/courseManagement";
import ActivityTracker from "./components/ActivityTracker";

import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Dashboard" element={<ActivityTracker><ProtectedRoute><Dashboard /></ProtectedRoute></ActivityTracker>} />
        <Route path="/user-management" element={<ActivityTracker><ProtectedRoute><UserManagement /></ProtectedRoute></ActivityTracker>} /> 
        <Route path="/results-page" element={<ActivityTracker><ProtectedRoute><ResultsPage /></ProtectedRoute></ActivityTracker>} /> 
        <Route path="/results-page" element={<ActivityTracker><ProtectedRoute><ResultsPage /></ProtectedRoute></ActivityTracker>} /> 
        <Route path="/course-management" element={<ActivityTracker><ProtectedRoute><CourseManagement /></ProtectedRoute></ActivityTracker>} /> 
      </Routes>
    </BrowserRouter>
  );
}
