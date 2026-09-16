import React from "react";
import { UtensilsCrossed, Bike, Leaf, Heart } from "lucide-react";

export default function WhyZukas() {
  const features = [
    {
      icon: UtensilsCrossed,
      title: "🍕 Delicious Food",
      description: "Freshly prepared food with authentic recipes and great taste in every single bite.",
      color: "#198C09",
    },
    {
      icon: Bike,
      title: "🚴 Fast Delivery",
      description: "Piping hot delivery straight from our kitchen to your doorstep without delay.",
      color: "#FF9F1C",
    },
    {
      icon: Leaf,
      title: "🌿 Fresh Ingredients",
      description: "Highest quality farm-fresh veggies, 100% real dairy cheese & zero compromises.",
      color: "#2A9D8F",
    },
    {
      icon: Heart,
      title: "❤️ Made With Love",
      description: "Thoughtfully crafted food tailored to create happier people and sweeter memories.",
      color: "#E63946",
    },
  ];

  return (
    <section id="why-zukas" className="why-zukas-section">
      <div className="section-container">
        <div className="section-header text-center">
          <span className="section-badge">OUR PROMISE</span>
          <h2 className="section-title">WHY ZUKAS KITCHEN?</h2>
          <p className="section-subtitle">
            We are passionate about delivering happiness on a plate.
          </p>
        </div>

        <div className="why-grid">
          {features.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div key={idx} className="why-card">
                <div
                  className="why-icon-bubble"
                  style={{ backgroundColor: `${item.color}15`, color: item.color }}
                >
                  <IconComp size={32} />
                </div>
                <h3 className="why-title">{item.title}</h3>
                <p className="why-desc">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
