import React from "react";
import { Smartphone, RotateCw, Ticket, Utensils } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      stepNumber: "01",
      icon: Smartphone,
      title: "Enter Your Mobile Number",
      description: "Just a quick step to get started and unlock your promotional spin eligibility.",
    },
    {
      stepNumber: "02",
      icon: RotateCw,
      title: "Spin the Wheel",
      description: "Try your luck on the interactive wheel and win exciting discounts & free food items.",
    },
    {
      stepNumber: "03",
      icon: Ticket,
      title: "Get Your Coupon",
      description: "Instantly receive a unique coupon code for your winning reward.",
    },
    {
      stepNumber: "04",
      icon: Utensils,
      title: "Order & Enjoy",
      description: "Apply your code at checkout and enjoy delicious Zukas Kitchen food delivered fresh!",
    },
  ];

  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="section-container">
        {/* Header */}
        <div className="section-header text-center">
          <span className="section-badge">SIMPLE STEPS</span>
          <h2 className="section-title">HOW IT WORKS?</h2>
          <p className="section-subtitle">
            Get your discount coupon in less than 30 seconds.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="steps-grid">
          {steps.map((step, idx) => {
            const IconComp = step.icon;
            return (
              <div key={step.stepNumber} className="step-card">
                <div className="step-badge">{step.stepNumber}</div>
                <div className="step-icon-bubble">
                  <IconComp size={28} className="step-icon" />
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
                {idx < steps.length - 1 && <div className="step-connector-line" />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
