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
    accent: 'text-[var(--f1-red)]',
    focus: ['Real-time telemetry', 'Strategy calls', 'Pit decisions', 'Tyre management'],
  },
  strategist: {
    id: 'strategist',
    label: 'Strategist',
    description: 'Long-term race planning',
    icon: <Navigation className="w-5 h-5" />,
    accent: 'text-[var(--neon-green)]',
    focus: ['Pit windows', 'Compound strategy', 'Undercut/overcut', 'Weather & SC'],
  },
  commentator: {
    id: 'commentator',
    label: 'Commentator',
    description: 'Race narrative & drama',
    icon: <Mic2 className="w-5 h-5" />,
    accent: 'text-[var(--amber)]',
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
        className="flex items-center gap-2 px-5 py-2.5 border border-[var(--border)] bg-[var(--carbon-mid)] hover:border-[var(--f1-red)] hover:bg-[var(--carbon-light)] text-[var(--text-primary)] transition-all duration-200 font-label uppercase tracking-widest text-sm clip-para-sm"
      >
        <span className={`${currentConfig.accent}`}>{currentConfig.icon}</span>
        <span>{currentConfig.label}</span>
        <span className="text-[10px] ml-2 text-[var(--text-secondary)]">▼</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-96 z-50 animate-slide-in-down"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pm-panel p-5 space-y-3 shadow-2xl bg-[var(--carbon-mid)]">
            {Object.values(ROLES).map((role) => (
              <button
                key={role.id}
                onClick={() => {
                  onRoleChange(role.id);
                  setIsOpen(false);
                }}
                className={`w-full p-4 border transition-colors text-left pm-panel ${
                  currentRole === role.id
                    ? 'border-[var(--f1-red)] bg-[var(--f1-red-dim)]'
                    : 'border-[var(--border)] bg-[var(--carbon-light)] hover:border-[var(--f1-red)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 transition-colors duration-200 ${role.accent}`}>{role.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-label text-lg font-bold text-[var(--text-primary)] uppercase tracking-wide">{role.label}</h3>
                    <p className="font-tele text-[10px] text-[var(--text-secondary)] mt-1">{role.description}</p>
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
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
