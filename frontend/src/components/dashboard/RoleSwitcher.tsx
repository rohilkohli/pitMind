import React, { useState } from 'react';
import { Zap, Navigation, Mic2 } from 'lucide-react';

export type UserRole = 'engineer' | 'strategist' | 'commentator';

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
    id: 'engineer',
    label: 'Engineer',
    description: 'Pit wall strategy & telemetry',
    icon: <Zap className="w-5 h-5" />,
    accent: 'text-f1-red',
    focus: ['Real-time telemetry', 'Strategy calls', 'Pit decisions', 'Tyre management'],
  },
  strategist: {
    id: 'strategist',
    label: 'Strategist',
    description: 'Long-term race planning',
    icon: <Navigation className="w-5 h-5" />,
    accent: 'text-blue-400',
    focus: ['Pit windows', 'Compound strategy', 'Undercut/overcut', 'Weather & SC'],
  },
  commentator: {
    id: 'commentator',
    label: 'Commentator',
    description: 'Race narrative & drama',
    icon: <Mic2 className="w-5 h-5" />,
    accent: 'text-amber-400',
    focus: ['Position battles', 'Driver narratives', 'Fan engagement', 'Highlights'],
  },
};

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentConfig = ROLES[currentRole];

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-pit-stroke bg-pit-panel/60 text-pit-fg hover:border-f1-red/40 hover:shadow-glow transition-all duration-200 font-bold uppercase tracking-wider text-sm"
      >
        {currentConfig.icon}
        <span>{currentConfig.label}</span>
        <span className="text-xs opacity-70">▼</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-3 w-96 z-50 animate-slide-in-down"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rounded-2xl border border-pit-stroke bg-pit-panel/95 backdrop-blur-xl shadow-glow-xl p-5 space-y-3">
            {Object.values(ROLES).map((role) => (
              <button
                key={role.id}
                onClick={() => {
                  onRoleChange(role.id);
                  setIsOpen(false);
                }}
                className={`w-full p-5 rounded-xl border-2 transition-all duration-200 text-left font-semibold ${
                  currentRole === role.id
                    ? 'border-f1-red/50 bg-f1-red/15 ring-2 ring-f1-red/30 shadow-glow-lg'
                    : 'border-pit-stroke bg-black/30 hover:border-f1-red/30 hover:bg-pit-panel/80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 transition-colors duration-200 ${role.accent}`}>{role.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-black text-pit-fg uppercase tracking-wide">{role.label}</h3>
                    <p className="text-xs text-pit-muted mt-1.5 font-medium">{role.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {role.focus.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-3 py-1.5 rounded-lg bg-pit-stroke/80 text-pit-muted font-bold uppercase tracking-wider"
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
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
