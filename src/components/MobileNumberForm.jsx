import React from "react";
import { Phone, ShieldCheck } from "lucide-react";

export default function MobileNumberForm({
  mobileNumber,
  setMobileNumber,
  error,
  setError,
  disabled,
}) {
  const handleChange = (e) => {
    const rawVal = e.target.value;
    // Strictly numeric only
    const digitsOnly = rawVal.replace(/\D/g, "");

    // Cap at 10 digits
    if (digitsOnly.length <= 10) {
      setMobileNumber(digitsOnly);
      if (error && (digitsOnly.length === 10 || digitsOnly.length === 0)) {
        setError("");
      }
    }
  };

  return (
    <div className="mobile-form-container">
      <label htmlFor="mobile-input" className="mobile-form-label">
        <span>Enter Mobile Number to Play</span>
        <span className="required-star">*</span>
      </label>

      <div className={`mobile-input-wrapper ${error ? "input-has-error" : ""}`}>
        <div className="country-code-badge">
          <span className="flag-icon">🇮🇳</span>
          <span className="country-code">+91</span>
        </div>

        <input
          id="mobile-input"
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          value={mobileNumber}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Enter 10-digit mobile number"
          className="mobile-text-input"
          autoComplete="tel-national"
        />

        {mobileNumber.length === 10 && !error && (
          <div className="input-success-icon" title="Valid 10-digit number">
            <ShieldCheck size={20} className="success-check" />
          </div>
        )}
      </div>

      {error && (
        <div className="form-error-message" role="alert">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="form-privacy-note">
        <Phone size={12} />
        <span>Used strictly for sending your coupon code & offer updates.</span>
      </div>
    </div>
  );
}
