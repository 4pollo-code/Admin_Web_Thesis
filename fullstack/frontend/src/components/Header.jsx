import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { GraduationCap, User } from "lucide-react";
import OTPModal from "../components/OTPModal";
import "./css/Header.css";

const HeaderBar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // track current path
  const navRefs = useRef({});

  const [underlineStyle, setUnderlineStyle] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);

  const [userInfo, setUserInfo] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const token = sessionStorage.getItem("token");
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "User Management", path: "/user-management" },
    { name: "Course Management", path: "/course-management" },
    { name: "Results View", path: "/results-page" },
  ];

  // derive active tab from current URL
  const activeTab =
    navItems.find((item) => item.path === location.pathname)?.name || "Dashboard";

  // underline positioning
  useEffect(() => {
    const currentTab = navRefs.current[activeTab];
    if (currentTab) {
      setUnderlineStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
      });
    }
  }, [activeTab, location]);

  // fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserInfo(response.data);
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };
    fetchUser();
  }, [token]);

  // close profile modal when clicking outside
  const modalRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowProfileModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // logout
  const handleLogout = async () => {
    console.log('Log out');
    try {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');         
      navigate("/");

    } catch (err) {
      console.error("Logout failed", err);
      alert("Logout failed: " + (err.response?.data?.error || err.message));
    }
  };


  // change password
  const handleChangePassword = () => {
    if (!newPassword || !confirmPassword) {
      alert("Please fill out all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    setShowChangePwModal(false);
    setShowOTPModal(true);
  };

  // helper: get user initials
  const getInitials = (first, last) => {
    if (!first && !last) return "";
    return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <div className="dashboard-header">
      {/* Logo & Profile */}
      <div className="header-content">
        <div className="logo-section">
          <GraduationCap size={32} color="white" />
          <h1 className="logo-text">Strandify</h1>
          <span className="logo-subtitle">Management</span>
        </div>

        <div className="user-avatar" ref={modalRef}>
          <button
            className="profile-btn"
            onClick={() => setShowProfileModal((prev) => !prev)}
          >
            {userInfo ? (
              <span className="avatar-text">
                {getInitials(userInfo.first_name, userInfo.last_name)}
              </span>
            ) : (
              <User size={24} color="#6b7280" />
            )}
          </button>

          {showProfileModal && (
            <div className="profile-modal">
              <p>
                Hello {userInfo?.first_name} {userInfo?.last_name}!
              </p>
              <button onClick={() => setShowChangePwModal(true)}>
                Change Password
              </button>
              <button onClick={() => setShowLogoutModal(true)}>Logout</button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="navigation">
        {navItems.map((item) => (
          <div
            key={item.name}
            ref={(el) => (navRefs.current[item.name] = el)}
            className={`nav-item ${activeTab === item.name ? "active" : ""}`}
          >
            <Link to={item.path}>{item.name}</Link>
          </div>
        ))}
        <div className="nav-underline" style={underlineStyle}></div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="modal-actions">
              <button onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePwModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Change Password</h3>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={() => setShowChangePwModal(false)}>Cancel</button>
              <button onClick={handleChangePassword}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOTPModal && (
        <OTPModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          mode="forgot"
          formData={{
            email: userInfo?.email || "user@example.com",
            newPassword,
            confirmPassword,
          }}
          onSuccess={() => {
            setShowOTPModal(false);
            setNewPassword("");
            setConfirmPassword("");
          }}
        />
      )}
    </div>
  );
};

export default HeaderBar;
