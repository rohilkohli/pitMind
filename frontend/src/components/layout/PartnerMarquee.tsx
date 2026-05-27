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
  opacity?: number;
}

const MarqueeRow: React.FC<MarqueeRowProps> = ({ logos, opacity = 0.5 }) => {
  // Duplicate logos for seamless infinite loop
  const displayLogos = [...logos, ...logos];

  return (
    <div className="pm-marquee-container" style={{ overflow: "hidden", width: "100%" }}>
      <style>{`
        @keyframes pm-marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .pm-marquee-track-animated {
          display: flex;
          width: max-content;
          animation: pm-marquee-scroll 30s linear infinite;
        }
        .pm-marquee-track-animated:hover {
          animation-play-state: paused;
        }
        .pm-marquee-logo {
          height: 50px;
          margin: 0 40px;
          transition: opacity 0.3s;
        }
        .pm-marquee-logo:hover {
          opacity: 1 !important;
        }
      `}</style>
      <div className="pm-marquee-track-animated">
        {displayLogos.map((src, i) => (
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
  const allLogos = categories.flatMap(cat => cat.logos);

  return (
    <div className="pm-partner-marquee-section">
      <div className="pm-partner-marquee-header">
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>OUR PARTNERS</div>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div className="pm-marquee-wrapper" style={{ background: "var(--carbon-light)", borderBottom: "1px solid var(--border)", padding: "16px 0" }}>
          <MarqueeRow logos={allLogos} opacity={0.7} />
        </div>
      </div>
    </div>
  );
};
