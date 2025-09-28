import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import { GraduationCap, User } from "lucide-react";
import OTPModal from "../components/OTPModal";
import "./css/Header.css";


const Header = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [underlineStyle, setUnderlineStyle] = useState({});
  const navRefs = useRef({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePwModal, setShowChangePwModal] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const getInitials = (first, last) => {
    if (!first && !last) return "";
    return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();
  };
  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "User Management", path: "/user-management" },
    { name: "Results View", path: "/results-page" },
  ];
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const currentTab = navRefs.current[activeTab];
    if (currentTab) {
      setUnderlineStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
      });
    }
  }, [activeTab]);

  // close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowProfileModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/me`, { withCredentials: true });
        setUserInfo(response.data);
        
      } catch (error) {
        console.error("Error fetching current user: ", error);
      }
    };
    fetchUser();
  }, []);
  
  const handleLogout = async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/logout`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        navigate(res.data.redirect || "/login");
      }
    } catch (err) {
      console.error("Logout failed", err);
      alert("Logout failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleChangePassword = async () => {
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

  return (
    <div className="dashboard-header">
      <div className="header-content">
        <div className="logo-section">
          <GraduationCap size={32} color="white" />
          <h1 className="logo-text">PathFinder</h1>
          <span className="logo-subtitle">Management</span>
        </div>

        {/* Profile Dropdown */}
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
              Hello {userInfo?.first_name} {userInfo?.last_name}!
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
            onClick={() => setActiveTab(item.name)}
          >
            <span>
              <Link to={item.path}>{item.name}</Link>
            </span>
          </div>
        ))}
        <div className="nav-underline" style={underlineStyle}></div>
      </div>

      {/* Logout Confirmation Modal */}
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
              <button onClick={() => setShowChangePwModal(false)}>
                Cancel
              </button>
              <button onClick={handleChangePassword}>Submit</button>
            </div>
          </div>
        </div>
      )}
      {showOTPModal && (
        <OTPModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          mode="forgot"
          formData={{ 
            email: "user@example.com", // replace with logged-in user’s email
            newPassword,
            confirmPassword
          }}
          onSuccess={() => {
            setShowOTPModal(false);
            setNewPassword("");
            setConfirmPassword("");
            alert("Password changed successfully!");
          }}
        />
      )}
    </div>
  );
};

export default Header;
