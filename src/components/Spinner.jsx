import React, { useEffect, useState, useRef } from "react";
import defaultPrizes from "../data/prizes";
import { soundFx } from "../utils/sound";
import zukasLogo from "../assets/zukasKirchenlogo.jpg";

const SPIN_DURATION_MS = 8500; // 8.5 seconds (within 8-10s target)

export default function Spinner({
  prizesList = defaultPrizes,
  targetIndex,
  isSpinning,
  onSpinComplete,
  disabled,
}) {
  const [rotationDegree, setRotationDegree] = useState(0);
  const isSpinningRef = useRef(false);
  const audioIntervalRef = useRef(null);

  const activePrizes = prizesList && prizesList.length > 0 ? prizesList : defaultPrizes;
  const numSegments = activePrizes.length;
  const segmentAngle = 360 / numSegments; // Dynamic angle (60 degrees for 6 items)

  // Handle spin triggering when targetIndex is set and isSpinning becomes true
  useEffect(() => {
    if (isSpinning && targetIndex !== null && !isSpinningRef.current) {
      isSpinningRef.current = true;

      // Calculate target rotation angle for exact segment alignment
      const segmentCenterAngle = targetIndex * segmentAngle + segmentAngle / 2;
      
      // Angle needed to bring segmentCenterAngle to top pointer (0 deg / 360 deg)
      const alignAngle = (360 - segmentCenterAngle) % 360;

      const minFullSpins = 8; // 8 full spins over 8.5s for exciting rotation
      const currentMod = rotationDegree % 360;
      
      let extraDeg = alignAngle - currentMod;
      if (extraDeg <= 0) {
        extraDeg += 360;
      }
      const newTotalRotation = rotationDegree + (minFullSpins * 360) + extraDeg;

      setRotationDegree(newTotalRotation);

      // Play tick sounds gradually decelerating over 8.5s spin duration
      let tickCount = 0;
      soundFx.triggerHaptic();
      
      audioIntervalRef.current = setInterval(() => {
        tickCount++;
        soundFx.playTick();
        soundFx.triggerHaptic();
        if (tickCount >= 40) {
          clearInterval(audioIntervalRef.current);
        }
      }, 200);

      // Complete spin ONLY after animation duration completes (8.5s)
      const timer = setTimeout(() => {
        clearInterval(audioIntervalRef.current);
        isSpinningRef.current = false;
        if (activePrizes[targetIndex]?.isWinningPrize) {
          soundFx.playWinChime();
        }
        if (onSpinComplete) {
          onSpinComplete();
        }
      }, SPIN_DURATION_MS);

      return () => {
        clearTimeout(timer);
        if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      };
    }
  }, [isSpinning, targetIndex, activePrizes]);

  // Helper to generate SVG pie slice path
  const getSlicePath = (index, total) => {
    const angle = 360 / total;
    const startAngle = index * angle;
    const endAngle = (index + 1) * angle;

    const radius = 190;
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = 200 + radius * Math.cos(startRad);
    const y1 = 200 + radius * Math.sin(startRad);
    const x2 = 200 + radius * Math.cos(endRad);
    const y2 = 200 + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return `M 200 200 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const studCount = numSegments * 2; // 12 studs for 6 segments

  return (
    <div className="spinner-wrapper">
      {/* Glow Backdrop */}
      <div className="spinner-glow-ring" />

      {/* Top Pointer Needle */}
      <div className="wheel-pointer-container">
        <div className="wheel-pointer">
          <div className="pointer-gem" />
        </div>
      </div>

      {/* Outer Decorative Metallic Ring */}
      <div className="wheel-outer-frame">
        {/* Outer Ring Stud Lights */}
        {Array.from({ length: studCount }).map((_, i) => {
          const deg = i * (360 / studCount);
          return (
            <div
              key={i}
              className={`ring-stud ${i % 2 === 0 ? "stud-bright" : ""}`}
              style={{
                transform: `rotate(${deg}deg) translate(0, -204px)`,
              }}
            />
          );
        })}

        {/* Rotating SVG Wheel Container */}
        <div
          className="wheel-rotating-disc"
          style={{
            transform: `rotate(${rotationDegree}deg)`,
            transition: isSpinning
              ? `transform ${SPIN_DURATION_MS / 1000}s cubic-bezier(0.12, 0.98, 0.18, 1.0)`
              : "none",
          }}
        >
          <svg
            viewBox="0 0 400 400"
            className="wheel-svg"
            aria-label="Spin Wheel Segment Canvas"
          >
            <defs>
              <filter id="segmentShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Render 6 Slices dynamically from activePrizes.length */}
            {activePrizes.map((prize, idx) => {
              const sliceAngle = (idx * segmentAngle) + (segmentAngle / 2);
              const textRad = (sliceAngle - 90) * (Math.PI / 180);
              const labelRadius = 125;
              const labelX = 200 + labelRadius * Math.cos(textRad);
              const labelY = 200 + labelRadius * Math.sin(textRad);
              const displayLabel = prize.wheelLabel || prize.label;

              return (
                <g key={prize.id || idx} className="wheel-segment-group">
                  {/* Sector Path */}
                  <path
                    d={getSlicePath(idx, numSegments)}
                    fill={prize.bgColor || "#198C09"}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />

                  {/* Divider Line */}
                  <line
                    x1="200"
                    y1="200"
                    x2={200 + 190 * Math.cos((idx * segmentAngle - 90) * (Math.PI / 180))}
                    y2={200 + 190 * Math.sin((idx * segmentAngle - 90) * (Math.PI / 180))}
                    stroke="#FFD700"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                  />

                  {/* Text Label Rotated to Radial Line */}
                  <g
                    transform={`translate(${labelX}, ${labelY}) rotate(${sliceAngle})`}
                    className="segment-text-container"
                  >
                    <text
                      x="0"
                      y="-4"
                      textAnchor="middle"
                      fill={prize.textColor || "#FFFFFF"}
                      className="segment-main-label"
                      style={{ fontSize: displayLabel.length > 12 ? "12px" : "14px" }}
                    >
                      {displayLabel}
                    </text>
                    {prize.subLabel && (
                      <text
                        x="0"
                        y="12"
                        textAnchor="middle"
                        fill={prize.textColor || "#FFFFFF"}
                        opacity="0.85"
                        className="segment-sub-label"
                      >
                        {prize.subLabel}
                      </text>
                    )}
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Center Zukas Kitchen Emblem Hub */}
        <div className="wheel-center-hub">
          <img src={zukasLogo} alt="Zukas Kitchen Logo" className="hub-logo-image" />
        </div>
      </div>

      {/* Accessible Screen Reader Status */}
      <div className="sr-only" aria-live="polite">
        {isSpinning
          ? "Wheel is spinning now..."
          : targetIndex !== null
          ? `Wheel stopped on ${activePrizes[targetIndex]?.label}`
          : "Wheel is ready to spin."}
      </div>
    </div>
  );
}
