import React from "react";

const categories = [
  {
    title: "AUTOMOTIVE & RACING",
    logos: [
      { src: "https://cdn.simpleicons.org/ferrari/white", name: "Ferrari" },
      { src: "https://cdn.simpleicons.org/mclaren/white", name: "McLaren" },
      { src: "https://cdn.simpleicons.org/redbull/white", name: "Red Bull Racing" },
      { src: "https://cdn.simpleicons.org/astonmartin/white", name: "Aston Martin" },
      { src: "https://cdn.simpleicons.org/renault/white", name: "Renault" },
    ],
  },
  {
    title: "TECHNOLOGY & DATA",
    logos: [
      { src: "https://cdn.simpleicons.org/lenovo/white", name: "Lenovo" },
      { src: "https://cdn.simpleicons.org/google/white", name: "Google" },
      { src: "https://cdn.simpleicons.org/apple/white", name: "Apple" },
    ],
  },
  {
    title: "FINANCE & LOGISTICS",
    logos: [
      { src: "https://cdn.simpleicons.org/dhl/white", name: "DHL" },
      { src: "https://cdn.simpleicons.org/qatarairways/white", name: "Qatar Airways" },
      { src: "https://cdn.simpleicons.org/americanexpress/white", name: "American Express" },
      { src: "https://cdn.simpleicons.org/visa/white", name: "Visa" },
      { src: "https://cdn.simpleicons.org/mastercard/white", name: "Mastercard" },
    ],
  },
  {
    title: "LIFESTYLE & ENTERTAINMENT",
    logos: [
      { src: "https://cdn.simpleicons.org/paramountplus/white", name: "Paramount+" },
      { src: "https://cdn.simpleicons.org/puma/white", name: "Puma" },
      { src: "https://cdn.simpleicons.org/mcdonalds/white", name: "McDonald's" },
    ],
  },
];


interface LogoEntry {
  src: string;
  name: string;
}

interface MarqueeRowProps {
  logos: LogoEntry[];
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
        {displayLogos.map((logo, i) => (
          <img
            key={`${logo.src}-${i}`}
            src={logo.src}
            alt={logo.name}
            className="pm-marquee-logo"
            style={{ opacity }}
          />
        ))}
      </div>
    </div>
  );
};

export const PartnerMarquee: React.FC = () => {
  const allLogos = categories.flatMap((cat) => cat.logos);

  return (
    <div className="pm-partner-marquee-section">
      <div className="pm-partner-marquee-header">
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 24,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
          }}
        >
          OUR PARTNERS
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          className="pm-marquee-wrapper"
          style={{
            background: "var(--carbon-light)",
            borderBottom: "1px solid var(--border)",
            padding: "16px 0",
          }}
        >
          <MarqueeRow logos={allLogos} opacity={0.7} />
        </div>
      </div>
    </div>
  );
};
