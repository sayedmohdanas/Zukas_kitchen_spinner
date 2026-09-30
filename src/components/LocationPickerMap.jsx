import React, { useEffect, useRef, useState } from "react";
import { Move } from "lucide-react";

export default function LocationPickerMap({ coords, onLocationChange }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletMarkerRef = useRef(null);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (window.L) {
      initLeafletMap();
      return;
    }

    const existingScript = document.getElementById("leaflet-js");
    if (existingScript) {
      existingScript.addEventListener("load", initLeafletMap);
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => initLeafletMap();
    document.head.appendChild(script);

    function initLeafletMap() {
      if (!mapRef.current || !window.L || leafletMapRef.current) return;
      const initialCenter = coords ? [coords.lat, coords.lng] : [26.2183, 82.9739];

      const map = window.L.map(mapRef.current, {
        center: initialCenter,
        zoom: 16,
        zoomControl: true,
      });
      leafletMapRef.current = map;

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      // Custom high-visibility red pin icon
      const customIcon = window.L.divIcon({
        className: "custom-leaflet-marker",
        html: `<div style="background:#E53E3E;width:28px;height:28px;border-radius:50%;border:3px solid #FFF;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#FFF;font-size:14px;cursor:grab;">📍</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = window.L.marker(initialCenter, {
        draggable: true,
        icon: customIcon,
      }).addTo(map);
      leafletMarkerRef.current = marker;

      // Marker Drag End
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        onLocationChange({ lat: position.lat, lng: position.lng });
      });

      // Map Click
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        map.panTo(e.latlng);
        onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }
  }, []);

  // Update map center & marker position when coords update externally
  useEffect(() => {
    if (coords && leafletMarkerRef.current && leafletMapRef.current) {
      const pos = [coords.lat, coords.lng];
      leafletMarkerRef.current.setLatLng(pos);
      leafletMapRef.current.panTo(pos);
    }
  }, [coords]);

  return (
    <div className="draggable-map-wrapper">
      <div className="map-drag-hint-bar">
        <Move size={14} className="drag-icon-pulse" />
        <span>Drag the red pin or tap on the map to set your exact spot</span>
      </div>

      <div ref={mapRef} className="interactive-google-map" style={{ width: "100%", height: "220px" }} />

      {coords && (
        <div className="map-coords-badge">
          <span>Selected Spot: <strong>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</strong></span>
        </div>
      )}
    </div>
  );
}
