import React from "react";
import { MapPin } from "lucide-react";

export default function LocationPickerMap({ coords }) {
  if (!coords) return null;

  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=17&output=embed`;

  return (
    <div className="draggable-map-wrapper">
      <div className="google-map-frame-container">
        <iframe
          title="Zukas Kitchen Google Maps Location Preview"
          width="100%"
          height="220"
          style={{ border: 0, borderRadius: "12px", width: "100%", height: "220px" }}
          loading="lazy"
          allowFullScreen
          src={googleMapsEmbedUrl}
        />
      </div>

      <div className="map-coords-badge">
        <MapPin size={13} className="pin-red-mini" />
        <span>Google Maps Pin: <strong>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</strong></span>
      </div>
    </div>
  );
}
