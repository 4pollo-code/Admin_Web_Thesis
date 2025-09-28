import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, X, User, Key } from 'lucide-react';
import axios from "axios";
import './css/login.css';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL;
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("API URL:", process.env.REACT_APP_API_URL);

  try {
    const res = await axios.post(
      `${API_BASE_URL}/login`,
      { 
        email: formData.email, 
        password: formData.password, 
      },
      { withCredentials: true }  // important for cookies/sessions
    );

    if (res.data.success) {
      navigate("/dashboard");
    } else {
      alert(res.data.message); // correct reference
    }
  } catch (err) {
    console.error(err);

    if (err.response?.data?.message) {
      alert(err.response.data.message);
    } else {
      alert("Something went wrong. Try again.");
    }
  }
};

  const handleClose = () => {
    console.log('Close modal');
    // Handle modal close
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };


  return (
    <div className="login-container">
      {/* Header */}
      <header className="login-header">
        <div className="logo-section">
          <div className="graduation-cap">🎓</div>
          <h1 className="logo-text">PathFinder</h1>
        </div>
        <p className="management-text">Management</p>
      </header>

      {/* Login Modal */}
      <div className="login-modal">
        <div className="modal-header">
          <div className="user-icon-container">
            <User size={32} className="user-icon" />
            <Key size={16} className="key-icon" />
          </div>
          <button className="close-btn" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="login-form">
          <div className="form-group">
            <div className="form-label">
              Email <span className="required">*</span>
            </div>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <div className="form-label">
              Password <span className="required">*</span>
            </div>
            <div className="password-container">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                className="form-input password-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

        

          <button className="login-btn" onClick={handleSubmit}>
            LOG - IN
          </button>
        </div>
      </div>
    </div>
  );
};

