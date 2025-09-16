import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

axios.defaults.withCredentials = true; 

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get("http://localhost:5000/check-session");
        if (res.data.logged_in) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } catch (err) {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) return <div>Loading...</div>;

  return authenticated ? children : <Navigate to="/login" replace />;
}