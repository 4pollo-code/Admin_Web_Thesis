import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./css/OTPModal.css";

const OTPModal = ({
  isOpen,
  onClose,
  formData = {},
  mode = "signup", // "signup" or "forgot"
  onSuccess
}) => {
  const { email = "", newPassword = "", confirmPassword = "" } = formData;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const API_BASE_URL = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

 
 useEffect(() => {
    const sendInitialOtp = async () => {
      if (!isOpen) return;

      setCooldown(60);

      try {
        if (mode === "forgot") {
          await axios.post(
            `${API_BASE_URL}/request-otp`,
            { email },
            { withCredentials: true }
          );
          console.log("Forgot password OTP sent");
        }
        // 👉 for signup, OTP is already sent during registration, so no resend here
      } catch (err) {
        console.error("Failed to send OTP:", err.response?.data || err.message);
      }
    };

    sendInitialOtp();
  }, [isOpen, mode, email]);

  const handleInputChange = (index, value) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      alert("Please enter the 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    try {
      let res;
      if (mode === "signup") {
        res = await axios.post(
          `${API_BASE_URL}/verify-email`,
          { otp: otpString },
          { withCredentials: true }
        );
        if (res.data.success) {
          
          if (onSuccess) onSuccess();
          navigate("/");
        }
      } else if (mode === "forgot") {
        if (!newPassword || !confirmPassword) {
          alert("Password and confirm password are required.");
          setIsLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          alert("Passwords do not match.");
          setIsLoading(false);
          return;
        }
        res = await axios.post(
          `${API_BASE_URL}/forgot-password`,
          { otp: otpString, newPassword },
          { withCredentials: true }
        );
        if (res.data.success) {
          if (onSuccess) onSuccess();
          alert("Password reset successfully!");
          navigate("/");
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    try {
      if (mode === "signup") {
        const res = await axios.post(`${API_BASE_URL}/signup/resend-otp`, {}, { withCredentials: true });
        alert(res.data.message || "New OTP sent!");
        setCooldown(60); // start 60s cooldown
      } else if (mode === "forgot") {
        await axios.post(`${API_BASE_URL}/request-otp`, { email }, { withCredentials: true });
        alert("New reset OTP sent!");
        setCooldown(60);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resend OTP.");
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal">
        <button className="otp-close" onClick={onClose}>
          ×
        </button>
        <div className="email-icon">
          <div className="envelope">
            <div className="location-pin"></div>
          </div>
        </div>
        <h2 className="title">
          {mode === "signup" ? "Verify Your Email Address" : "Reset Your Password"}
        </h2>
        <p className="description">
          Enter the 6-digit code we sent to your email{" "}
          {mode === "signup" ? "to complete signup." : "to reset your password."}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="otp-input-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                className="otp-digit"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                maxLength="1"
              />
            ))}
          </div>

          <button type="submit" className="otp-submit" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <button
          className="otp-resend"
          onClick={handleResend}
          disabled={isLoading || cooldown > 0}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
        </button>
      </div>
    </div>
  );
};

export default OTPModal;
