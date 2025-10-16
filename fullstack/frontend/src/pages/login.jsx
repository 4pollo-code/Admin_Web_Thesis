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
  console.log("API URL:", API_BASE_URL);

  try {
    const res = await axios.post(`${API_BASE_URL}/login`, {
      email: formData.email,
      password: formData.password,
    });

    if (res.data.success && res.data.token) {
      const token = res.data.token;
      sessionStorage.setItem("token", token);
      navigate("/dashboard");
    } else {
      alert(res.data.message || "Login failed");
    }
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Something went wrong. Try again.");
  }
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
          <h1 className="logo-text">Strandify</h1>
        </div>
        <p className="management-text">Management</p>
      </header>

      {/* Login Modal */}
      <div className="login-modal">
        <div className="login-modal-header">
          <div className="user-icon-container">
            <User size={32} className="user-icon" />
            <Key size={16} className="key-icon" />
          </div>
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

