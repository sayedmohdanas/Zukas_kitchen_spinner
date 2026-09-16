import React from "react";
import { X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { config } from "../config/config";

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const rules = [
    "One promotional spin is allowed per eligible mobile number per campaign period.",
    "Coupon codes generated during this promotional event are single-use only.",
    "Offers and discounts cannot be combined with other existing restaurant promotions or coupons.",
    "Coupon validity, expiration, and minimum order requirements are subject to campaign guidelines.",
    "Zukas Kitchen reserves the right to modify, pause, or update campaign terms at its sole discretion.",
    "Actual coupon eligibility, uniqueness, and redemption will be verified by the Zukas Kitchen backend system upon order checkout.",
  ];

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div
        className="terms-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
      >
        <div className="terms-header">
          <div className="terms-title-group">
            <ShieldAlert className="terms-icon" size={24} />
            <h2 id="terms-modal-title" className="terms-title">
              Campaign Terms & Conditions
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="terms-body">
          <p className="terms-intro">
            Welcome to the <strong>{config.brandName}</strong> {config.campaignName} campaign. By entering your mobile number and participating in this promotion, you agree to the following rules:
          </p>

          <ul className="terms-list">
            {rules.map((rule, idx) => (
              <li key={idx} className="terms-item">
                <CheckCircle2 size={18} className="terms-check-icon" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="terms-footer">
          <button
            type="button"
            className="terms-agree-btn"
            onClick={onClose}
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}
