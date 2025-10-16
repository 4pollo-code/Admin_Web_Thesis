import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

export default function ActivityTracker({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const resetTimer = () => {
      sessionStorage.setItem("lastActive", Date.now());
    };

    const checkInactivity = () => {
      const lastActive = parseInt(sessionStorage.getItem("lastActive") || Date.now());
      if (Date.now() - lastActive > INACTIVITY_LIMIT) {
        sessionStorage.removeItem("token"); // invalidate token
        navigate("/", { replace: true });  // redirect to login
      }
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); // initialize

    const interval = setInterval(checkInactivity, 60 * 1000); // check every minute

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearInterval(interval);
    };
  }, [navigate]);

  return children;
}
