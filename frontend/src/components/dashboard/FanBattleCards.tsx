/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React, { useState } from 'react';
import { Crown, Zap, TrendingDown, TrendingUp } from 'lucide-react';

export interface BattleCard {
  id: string;
  driver1: {
    name: string;
    number: number;
    position: number;
    gap: number;
  };
  driver2: {
    name: string;
    number: number;
    position: number;
    gap: number;
  };
  lap: number;
  narrative: string;
  intensity: 'intense' | 'interesting' | 'developing' | 'over';
  momentum: 'advantage_1' | 'advantage_2' | 'contested';
  highlight?: string;
}

interface FanBattleCardsProps {
  battles?: BattleCard[];
  onSelectBattle?: (battle: BattleCard) => void;
}

// Mock battles for fan engagement
const MOCK_BATTLES: BattleCard[] = [
  {
    id: 'battle_1',
    driver1: { name: 'Verstappen', number: 1, position: 1, gap: 0.0 },
    driver2: { name: 'Leclerc', number: 16, position: 2, gap: 1.2 },
    lap: 28,
    narrative:
      'Verstappen controls the lead after a brilliant pit stop exit. Leclerc shadows closely, waiting for a DRS opportunity at the next straight.',
    intensity: 'intense',
    momentum: 'advantage_1',
    highlight: 'Verstappen extends gap by 0.3s per lap',
  },
  {
    id: 'battle_2',
    driver1: { name: 'Hamilton', number: 44, position: 3, gap: 2.1 },
    driver2: { name: 'Norris', number: 4, position: 4, gap: 2.8 },
    lap: 28,
    narrative:
      'Hamilton makes up ground after tyre recovery. Norris defends but loses pace in the slow corners. Battle for P3 heating up.',
    intensity: 'interesting',
    momentum: 'advantage_1',
    highlight: 'Hamilton gaining ~0.2s per lap',
  },
  {
    id: 'battle_3',
    driver1: { name: 'Sainz', number: 55, position: 5, gap: 4.3 },
    driver2: { name: 'Alonso', number: 14, position: 6, gap: 5.1 },
    lap: 28,
    narrative:
      'Sainz chases Alonso with fresh tyres. Alonso executing a masterclass in defensive driving, using line width expertly.',
    intensity: 'interesting',
    momentum: 'contested',
    highlight: 'Duel continues into turn 12',
  },
  {
    id: 'battle_4',
    driver1: { name: 'Tsunoda', number: 22, position: 9, gap: 11.2 },
    driver2: { name: 'Bottas', number: 77, position: 10, gap: 12.1 },
    lap: 28,
    narrative: 'Tsunoda consolidates P9 as Bottas faces tyre graining issues. Gap stable, but Tsunoda pace advantage evident.',
    intensity: 'developing',
    momentum: 'advantage_1',
  },
];

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'intense':
      return 'border-[var(--f1-red)] bg-[var(--f1-red-dim)]';
    case 'interesting':
      return 'border-[var(--amber)] bg-[var(--amber-dim)]';
    case 'developing':
      return 'border-[var(--neon-green)] bg-[var(--neon-green-dim)]';
    case 'over':
      return 'border-[var(--border)] bg-[var(--carbon-mid)]';
    default:
      return 'border-[var(--border)] bg-[var(--carbon-light)]';
  }
};

const getMomentumIcon = (momentum: string) => {
  switch (momentum) {
    case 'advantage_1':
      return <TrendingUp className="w-4 h-4" />;
    case 'advantage_2':
      return <TrendingDown className="w-4 h-4" />;
    case 'contested':
      return <Zap className="w-4 h-4 text-amber-400" />;
    default:
      return null;
  }
};

const getMomentumLabel = (momentum: string, driver1Name: string, driver2Name: string) => {
  switch (momentum) {
    case 'advantage_1':
      return `${driver1Name} advantage`;
    case 'advantage_2':
      return `${driver2Name} advantage`;
    case 'contested':
      return 'Evenly matched';
    default:
      return '';
  }
};

export const FanBattleCards: React.FC<FanBattleCardsProps> = ({
  battles = MOCK_BATTLES,
  onSelectBattle,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="pm-panel" style={{ padding: 24 }}>
      <div className="mb-6">
        <h3 className="font-label tracking-widest text-lg font-bold text-[var(--text-primary)] uppercase flex items-center gap-2">
          <Crown className="w-5 h-5 text-[var(--f1-red)]" />
          Race Battles
        </h3>
        <p className="font-tele text-xs text-[var(--text-secondary)] mt-1">Live position battles and narrative highlights</p>
      </div>

      <div className="space-y-4">
        {battles.map((battle) => (
          <div
            key={battle.id}
            onClick={() => {
              setSelectedId(battle.id);
              onSelectBattle?.(battle);
            }}
            className={`cursor-pointer border p-4 transition-all pm-panel ${
              selectedId === battle.id
                ? 'border-[var(--f1-red)] bg-[var(--f1-red-dim)] ring-1 ring-[var(--f1-red-glow)]'
                : getIntensityColor(battle.intensity)
            }`}
          >
            {/* Header with lap number and intensity badge */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-label text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider bg-[var(--carbon-mid)] border border-[var(--border)] px-2 py-1">
                  Lap {battle.lap}
                </span>
                <span
                  className={`font-label text-xs font-bold uppercase tracking-wider px-2 py-1 border ${
                    battle.intensity === 'intense'
                      ? 'bg-[var(--f1-red-dim)] text-[var(--f1-red)] border-[var(--f1-red)]'
                      : battle.intensity === 'interesting'
                      ? 'bg-[var(--amber-dim)] text-[var(--amber)] border-[var(--amber)]'
                      : battle.intensity === 'developing'
                      ? 'bg-[var(--neon-green-dim)] text-[var(--neon-green)] border-[var(--neon-green)]'
                      : 'bg-[var(--border)] text-[var(--text-secondary)] border-[var(--border)]'
                  }`}
                >
                  {battle.intensity}
                </span>
              </div>

              {battle.highlight && (
                <p className="text-xs text-f1-red font-semibold text-right">{battle.highlight}</p>
              )}
            </div>

            {/* Drivers comparison */}
            <div className="mb-4">
              <div className="grid grid-cols-[1fr_1fr] gap-4 mb-3">
                {/* Driver 1 */}
                <div className="text-center p-3 bg-[var(--carbon-mid)] border border-[var(--border)]">
                  <div className="font-label text-lg font-bold text-[var(--text-primary)] tracking-wide">{battle.driver1.name}</div>
                  <div className="font-race text-xs text-[var(--text-secondary)] mt-1">P{battle.driver1.position}</div>
                  <div className="font-tele text-xs text-[var(--f1-red)] mt-1">#{battle.driver1.number}</div>
                </div>

                {/* Driver 2 */}
                <div className="text-center p-3 bg-[var(--carbon-mid)] border border-[var(--border)]">
                  <div className="font-label text-lg font-bold text-[var(--text-primary)] tracking-wide">{battle.driver2.name}</div>
                  <div className="font-race text-xs text-[var(--text-secondary)] mt-1">P{battle.driver2.position}</div>
                  <div className="font-tele text-xs text-[var(--f1-red)] mt-1">#{battle.driver2.number}</div>
                </div>
              </div>

              {/* Gap indicator */}
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span className="font-label tracking-widest uppercase">Gap</span>
                <span className="font-race text-[var(--text-primary)]">
                  {Math.abs(battle.driver1.gap - battle.driver2.gap).toFixed(2)}s
                </span>
              </div>

              {/* Momentum */}
              <div className="flex items-center justify-center gap-2 mt-3 text-xs font-semibold text-[var(--f1-red)]">
                {getMomentumIcon(battle.momentum)}
                {getMomentumLabel(battle.momentum, battle.driver1.name, battle.driver2.name)}
              </div>
            </div>

            {/* Narrative */}
            <p className="font-tele text-[11px] text-[var(--text-primary)] leading-relaxed p-3 bg-[var(--carbon-mid)] border border-[var(--border)]">
              {battle.narrative}
            </p>

            {/* Selection indicator */}
            {selectedId === battle.id && (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="font-label tracking-wider text-xs text-[var(--f1-red)] font-semibold uppercase">✓ Watching this battle</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fan engagement callout */}
      <div className="mt-6 p-4 bg-[var(--carbon-mid)] border border-[var(--border)]">
        <p className="font-tele text-[10px] text-[var(--text-secondary)]">
          <span className="font-label tracking-widest text-[var(--text-primary)] uppercase mr-2">Pro tip:</span> Click any battle card to follow that storyline in detail. Track position changes, gaps, and narrative arcs as they unfold lap by lap.
        </p>
      </div>
    </div>
  );
};
