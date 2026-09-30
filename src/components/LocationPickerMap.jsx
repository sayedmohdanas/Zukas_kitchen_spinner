import React, { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Move } from "lucide-react";

export default function LocationPickerMap({ coords, onLocationChange }) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);
  const [loadError, setLoadError] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setLoadError(true);
      return;
    }

    // Load Google Maps Script dynamically if not already loaded
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps) {
        initMap();
        return;
      }

      const existingScript = document.getElementById("google-maps-js-sdk");
      if (existingScript) {
        existingScript.addEventListener("load", initMap);
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-js-sdk";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initMap();
      };
      script.onerror = () => {
        setLoadError(true);
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || !window.google || !window.google.maps) return;

      const initialCenter = coords || { lat: 26.2183, lng: 82.9739 }; // Default Zukas region

      // Create Map
      const map = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 17,
        mapTypeId: "roadmap",
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy", // Allow touch dragging easily on mobile
      });
      googleMapRef.current = map;

      // Create Draggable Marker
      const marker = new window.google.maps.Marker({
        position: initialCenter,
        map: map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        title: "Drag to set exact delivery spot",
      });
      markerRef.current = marker;

      setIsMapLoaded(true);

      // Event Listener: Marker Dragged
      marker.addListener("dragend", (e) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        onLocationChange({ lat: newLat, lng: newLng });
      });

      // Event Listener: Map Clicked (move marker to click position)
      map.addListener("click", (e) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        marker.setPosition(e.latLng);
        map.panTo(e.latLng);
        onLocationChange({ lat: newLat, lng: newLng });
      });
    };

    loadGoogleMapsScript();
  }, [apiKey]);

  // Update map center & marker position if coords prop updates externally
  useEffect(() => {
    if (coords && googleMapRef.current && markerRef.current) {
      const position = new window.google.maps.LatLng(coords.lat, coords.lng);
      markerRef.current.setPosition(position);
      googleMapRef.current.panTo(position);
    }
  }, [coords]);

  if (loadError) {
    return (
      <div className="map-fallback-box">
        <div className="map-fallback-info">
          <MapPin size={16} className="pin-red" />
          <span>Coordinates: {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Not set"}</span>
        </div>
        <p className="fallback-help-text">Drag location unavailable. Tap Share My Current Location to update.</p>
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
