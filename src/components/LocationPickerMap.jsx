import React, { useEffect, useRef, useState } from "react";
import { MapPin, Move } from "lucide-react";

export default function LocationPickerMap({ coords, onLocationChange }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletMarkerRef = useRef(null);
  const googleMapRef = useRef(null);
  const googleMarkerRef = useRef(null);
  const [loadError, setLoadError] = useState(false);

  const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || "AIzaSyAbwv5P-iff_vVB7TpstiQ1RI1kvktza47";

  useEffect(() => {
    // Load Google Maps JS SDK
    loadGoogleMaps();

    function loadGoogleMaps() {
      if (window.google && window.google.maps) {
        initGoogleMap();
        return;
      }
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
      script.async = true;
      script.onload = () => initGoogleMap();
      script.onerror = () => loadLeafletMaps();
      document.head.appendChild(script);
    }

    function initGoogleMap() {
      if (!mapRef.current || !window.google || !window.google.maps) return;
      const initialCenter = coords || { lat: 26.2183, lng: 82.9739 };

      const map = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 17,
        gestureHandling: "greedy",
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
      });
      googleMapRef.current = map;

      const marker = new window.google.maps.Marker({
        position: initialCenter,
        map: map,
        draggable: true,
        title: "Drag to set exact delivery spot",
      });
      googleMarkerRef.current = marker;

      marker.addListener("dragend", (e) => {
        onLocationChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });

      map.addListener("click", (e) => {
        marker.setPosition(e.latLng);
        map.panTo(e.latLng);
        onLocationChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
    }

    function loadLeafletMaps() {
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
      script.onerror = () => setLoadError(true);
      document.head.appendChild(script);
    }

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

      // Custom red pin icon
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
  }, [googleApiKey]);

  // Sync prop changes
  useEffect(() => {
    if (coords) {
      if (googleMarkerRef.current && googleMapRef.current) {
        const pos = new window.google.maps.LatLng(coords.lat, coords.lng);
        googleMarkerRef.current.setPosition(pos);
        googleMapRef.current.panTo(pos);
      } else if (leafletMarkerRef.current && leafletMapRef.current) {
        const pos = [coords.lat, coords.lng];
        leafletMarkerRef.current.setLatLng(pos);
        leafletMapRef.current.panTo(pos);
      }
    }
  }, [coords]);

  if (loadError) {
    return (
      <div className="map-fallback-box">
        <div className="map-fallback-info">
          <MapPin size={16} className="pin-red" />
          <span>Coordinates: {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Not set"}</span>
        </div>
      </div>
    );
  }

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
