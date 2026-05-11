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
    icon: <Zap className="w-4 h-4" />,
    accent: 'text-pit-accent',
    focus: ['Real-time telemetry', 'Strategy calls', 'Pit decisions', 'Tyre management'],
  },
  strategist: {
    id: 'strategist',
    label: 'Strategist',
    description: 'Long-term race planning',
    icon: <Navigation className="w-4 h-4" />,
    accent: 'text-blue-400',
    focus: ['Pit windows', 'Compound strategy', 'Undercut/overcut', 'Weather & SC'],
  },
  commentator: {
    id: 'commentator',
    label: 'Commentator',
    description: 'Race narrative & drama',
    icon: <Mic2 className="w-4 h-4" />,
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
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-black/20 text-pit-fg hover:border-white/20 hover:bg-black/30 transition"
      >
        {currentConfig.icon}
        <span className="font-medium text-sm">{currentConfig.label}</span>
        <span className="text-xs text-pit-muted">▼</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-80 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl p-4 space-y-3">
            {Object.values(ROLES).map((role) => (
              <button
                key={role.id}
                onClick={() => {
                  onRoleChange(role.id);
                  setIsOpen(false);
                }}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  currentRole === role.id
                    ? 'border-pit-accent bg-pit-accent/15 ring-2 ring-pit-accent/30'
                    : 'border-white/10 bg-black/30 hover:border-white/20 hover:bg-black/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${role.accent}`}>{role.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-pit-fg">{role.label}</h3>
                    <p className="text-xs text-pit-muted mt-1">{role.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {role.focus.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-pit-muted"
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
