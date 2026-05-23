/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, @typescript-eslint/no-unused-vars */
import React from "react";

const categories = [
  {
    title: "AUTOMOTIVE & RACING",
    logos: [
      "https://cdn.simpleicons.org/ferrari/white",
      "https://cdn.simpleicons.org/mclaren/white",
      "https://cdn.simpleicons.org/redbull/white",
      "https://cdn.simpleicons.org/astonmartin/white",
      "https://cdn.simpleicons.org/renault/white",
    ]
  },
  {
    title: "TECHNOLOGY & DATA",
    logos: [
      "https://cdn.simpleicons.org/lenovo/white",
      "https://cdn.simpleicons.org/google/white",
      "https://cdn.simpleicons.org/apple/white",
    ]
  },
  {
    title: "FINANCE & LOGISTICS",
    logos: [
      "https://cdn.simpleicons.org/dhl/white",
      "https://cdn.simpleicons.org/qatarairways/white",
      "https://cdn.simpleicons.org/americanexpress/white",
      "https://cdn.simpleicons.org/visa/white",
      "https://cdn.simpleicons.org/mastercard/white",
    ]
  },
  {
    title: "LIFESTYLE & ENTERTAINMENT",
    logos: [
      "https://cdn.simpleicons.org/paramountplus/white",
      "https://cdn.simpleicons.org/puma/white",
      "https://cdn.simpleicons.org/mcdonalds/white",
    ]
  }
];

interface MarqueeRowProps {
  logos: string[];
  direction?: "left" | "right";
  duration?: number;
  opacity?: number;
}

const MarqueeRow: React.FC<MarqueeRowProps> = ({ logos, direction = "left", duration = 40, opacity = 0.5 }) => {
  return (
    <div className="pm-marquee-container">
      <div className="pm-marquee-track pm-static-track">
        {/* Render logos once since it's static */}
        {logos.map((src, i) => (
          <img 
            key={`${src}-${i}`} 
            src={src} 
            alt="Partner Logo" 
            className="pm-marquee-logo" 
            style={{ opacity }}
          />
        ))}
      </div>
    </div>
  );
};

export const PartnerMarquee: React.FC = () => {
  return (
    <div className="pm-partner-marquee-section">
      <div className="pm-partner-marquee-header">
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>OUR PARTNERS</div>
        <div 
          onClick={() => alert("Full partner directory coming soon!")}
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, color: "var(--text-secondary)", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", transition: "color 0.2s" }} 
          className="hover-white"
        >
          View all
        </div>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column" }}>
        {categories.map((cat, idx) => (
          <div key={cat.title} className="pm-marquee-wrapper" style={{ background: idx % 2 === 0 ? "var(--carbon-light)" : "var(--carbon)", borderBottom: "1px solid var(--border)", padding: "40px 80px" }}>
            <MarqueeRow logos={cat.logos} opacity={0.7} />
          </div>
        ))}
      </div>
    </div>
  );
};
