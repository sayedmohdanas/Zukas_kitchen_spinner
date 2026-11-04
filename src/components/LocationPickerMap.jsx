import React, { useEffect, useRef, useState } from "react";
import { Move, MapPin } from "lucide-react";

export default function LocationPickerMap({ coords, onLocationChange }) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const googleMarkerRef = useRef(null);
  const [useEmbedFallback, setUseEmbedFallback] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || "AIzaSyAbwv5P-iff_vVB7TpstiQ1RI1kvktza47";

  useEffect(() => {
    // Purge any old script or link tags
    const oldLeafletCss = document.getElementById("leaflet-css");
    if (oldLeafletCss) oldLeafletCss.remove();
    const oldLeafletJs = document.getElementById("leaflet-js");
    if (oldLeafletJs) oldLeafletJs.remove();

    // Catch Google Maps auth failure silently
    window.gm_authFailure = () => {
      console.warn("Google Maps auth failure, displaying Google Maps Embed frame.");
      setUseEmbedFallback(true);
    };

    if (window.google && window.google.maps) {
      initGoogleMap();
      return;
    }

    const existingScript = document.getElementById("google-maps-js-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", initGoogleMap);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js-sdk";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => initGoogleMap();
    script.onerror = () => setUseEmbedFallback(true);
    document.head.appendChild(script);

    function initGoogleMap() {
      if (!mapRef.current || !window.google || !window.google.maps) return;
      const initialCenter = coords || { lat: 26.2183, lng: 82.9739 };

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: 17,
          gestureHandling: "greedy",
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        googleMapRef.current = map;

        const marker = new window.google.maps.Marker({
          position: initialCenter,
          map: map,
          draggable: true,
          title: "Drag to set exact delivery spot",
        });
        googleMarkerRef.current = marker;

        // Marker Dragged
        marker.addListener("dragend", (e) => {
          if (onLocationChange) {
            onLocationChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }
        });

        // Map Clicked
        map.addListener("click", (e) => {
          marker.setPosition(e.latLng);
          map.panTo(e.latLng);
          if (onLocationChange) {
            onLocationChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }
        });
      } catch (err) {
        console.error("Error initializing Google Maps:", err);
        setUseEmbedFallback(true);
      }
    }
  }, [apiKey]);

  // Sync external coords updates
  useEffect(() => {
    if (coords && googleMarkerRef.current && googleMapRef.current && window.google?.maps) {
      const pos = new window.google.maps.LatLng(coords.lat, coords.lng);
      googleMarkerRef.current.setPosition(pos);
      googleMapRef.current.panTo(pos);
    }
  }, [coords]);

  if (!coords) return null;

  if (useEmbedFallback) {
    return (
      <div className="draggable-map-wrapper">
        <div className="google-map-frame-container">
          <iframe
            title="Google Maps Location Preview"
            width="100%"
            height="220"
            style={{ border: 0, borderRadius: "12px", width: "100%", height: "220px" }}
            loading="lazy"
            allowFullScreen
            src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=17&output=embed`}
          />
        </div>
        <div className="map-coords-badge">
          <MapPin size={13} className="pin-red-mini" />
          <span>Google Maps Location: <strong>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</strong></span>
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
