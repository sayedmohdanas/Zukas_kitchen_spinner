import React from "react";
import { User, Sparkles } from "lucide-react";

export default function NameInputForm({
  userName,
  setUserName,
  error,
  setError,
  disabled,
}) {
  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length <= 50) {
      setUserName(val);
      if (error) {
        setError("");
      }
    }
  };

  return (
    <div className="mobile-form-container">
      <label htmlFor="name-input" className="mobile-form-label">
        <span>What's your name?</span>
        <span className="required-star">*</span>
      </label>

      <div className={`mobile-input-wrapper ${error ? "input-has-error" : ""}`}>
        <div className="country-code-badge" style={{ gap: "6px" }}>
          <User size={18} className="text-zukas-green" style={{ color: "#198C09" }} />
        </div>

        <input
          id="name-input"
          type="text"
          maxLength={50}
          value={userName}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Enter your name"
          className="mobile-text-input"
          autoComplete="name"
          style={{ paddingLeft: "8px" }}
        />

        {userName.trim().length >= 2 && !error && (
          <div className="input-success-icon" title="Valid name">
            <Sparkles size={18} style={{ color: "#FFD700" }} />
          </div>
        )}
      </div>

      {error && (
        <div className="form-error-message" role="alert">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="form-privacy-note">
        <span>🎁 Spin the wheel and discover your offer</span>
      </div>
    </div>
  );
}
