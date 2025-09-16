import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import { GraduationCap, User } from "lucide-react";
import "./css/Header.css";

const Header = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [underlineStyle, setUnderlineStyle] = useState({});
  const navRefs = useRef({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const modalRef = useRef(null);
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "User Management", path: "/user-management" },
  ];

  useEffect(() => {
    const currentTab = navRefs.current[activeTab];
    if (currentTab) {
      setUnderlineStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
      });
    }
  }, [activeTab]);

  // close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowProfileModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
    
      if (res.data.success) {
        navigate(res.data.redirect || "/login");
      }
    } catch (err) {
      console.error("Logout failed", err);
      alert("Logout failed: " + (err.response?.data?.error || err.message));
    }
    
  };

  const handleChangePassword = () => {
    alert("Change Password clicked!"); 
    setShowProfileModal(false);
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
            <User size={24} color="#6b7280" />
          </button>

          {showProfileModal && (
            <div className="profile-modal">
              <button onClick={handleChangePassword}>Change Password</button>
              <button onClick={handleLogout}>Logout</button>
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
    </div>
  );
};

export default Header;
