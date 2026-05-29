import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Zap, Navigation, Mic2 } from "lucide-react";

export type UserRole = "engineer" | "strategist" | "commentator";

export interface RoleConfig {
  id: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  focus: string[];
}

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const ROLES: Record<UserRole, RoleConfig> = {
  engineer: {
    id: "engineer",
    label: "Engineer",
    description: "Pit wall strategy & telemetry",
    icon: <Zap className="w-5 h-5" />,
    accent: "text-[var(--f1-red)]",
    focus: ["Real-time telemetry", "Strategy calls", "Pit decisions", "Tyre management"],
  },
  strategist: {
    id: "strategist",
    label: "Strategist",
    description: "Long-term race planning",
    icon: <Navigation className="w-5 h-5" />,
    accent: "text-[var(--neon-green)]",
    focus: ["Pit windows", "Compound strategy", "Undercut/overcut", "Weather & SC"],
  },
  commentator: {
    id: "commentator",
    label: "Commentator",
    description: "Race narrative & drama",
    icon: <Mic2 className="w-5 h-5" />,
    accent: "text-[var(--amber)]",
    focus: ["Position battles", "Driver narratives", "Fan engagement", "Highlights"],
  },
};

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const currentConfig = ROLES[currentRole];

  // Recalculate anchor position whenever dropdown opens or window resizes
  useEffect(() => {
    if (!isOpen) return;

    const recalc = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8, // 8px gap below button
        right: window.innerWidth - rect.right, // right-aligned to button
      });
    };

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setIsOpen(false);
  };

  // Portal contents — rendered into document.body to escape all stacking contexts
  const portal = isOpen
    ? ReactDOM.createPortal(
        <>
          {/* Invisible backdrop — click-outside to close */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999998,
            }}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown panel — always on top */}
          <div
            role="menu"
            aria-label="Select role"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: dropdownPos.top,
              right: dropdownPos.right,
              width: 384,
              zIndex: 999999,
              animation: "slideInDown 0.15s ease",
            }}
          >
            <div
              className="pm-panel p-5 space-y-3"
              style={{
                background: "var(--carbon-mid)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.75), 0 0 0 1px var(--border)",
              }}
            >
              {Object.values(ROLES).map((role) => (
                <button
                  key={role.id}
                  role="menuitem"
                  onClick={() => {
                    onRoleChange(role.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-4 border transition-colors text-left pm-panel ${
                    currentRole === role.id
                      ? "border-[var(--f1-red)] bg-[var(--f1-red-dim)]"
                      : "border-[var(--border)] bg-[var(--carbon-light)] hover:border-[var(--f1-red)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 transition-colors duration-200 ${role.accent}`}>
                      {role.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-label text-lg font-bold text-[var(--text-primary)] uppercase tracking-wide">
                        {role.label}
                      </h3>
                      <p className="font-tele text-[10px] text-[var(--text-secondary)] mt-1">
                        {role.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {role.focus.map((item, idx) => (
                          <span
                            key={idx}
                            className="font-tele text-[9px] px-2 py-1 bg-[var(--carbon-mid)] border border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-widest"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Current role: ${currentConfig.label}. Click to change role.`}
        className="flex items-center gap-2 px-5 py-2.5 border border-[var(--border)] bg-[var(--carbon-mid)] hover:border-[var(--f1-red)] hover:bg-[var(--carbon-light)] text-[var(--text-primary)] transition-all duration-200 font-label uppercase tracking-widest text-sm clip-para-sm"
      >
        <span className={currentConfig.accent}>{currentConfig.icon}</span>
        <span>{currentConfig.label}</span>
        <span
          style={{
            fontSize: 10,
            marginLeft: 8,
            color: "var(--text-secondary)",
            transition: "transform 0.2s",
            display: "inline-block",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </button>

      {portal}
    </div>
  );
};
