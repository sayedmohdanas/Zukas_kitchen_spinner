import React from "react";
import { MessageSquare } from "lucide-react";
import { trackEvent } from "../utils/analytics";
import { getWhatsAppOrderLink } from "../utils/whatsapp";

export default function FloatingWhatsAppCTA({ isModalOpen }) {
  if (isModalOpen) return null;

  const handleClick = () => {
    trackEvent("order_clicked", { source: "floating_bottom_bar" });
    window.open(getWhatsAppOrderLink(), "_blank");
  };

  return (
    <div className="floating-whatsapp-container">
      <button
        type="button"
        className="floating-whatsapp-btn"
        onClick={handleClick}
        aria-label="Order on WhatsApp"
      >
        <MessageSquare size={20} />
        <span>ORDER ON WHATSAPP</span>
      </button>
    </div>
  );
}
