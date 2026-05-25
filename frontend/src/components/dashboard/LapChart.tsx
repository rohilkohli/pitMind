import { useId, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

export type LapData = { lap: number } & Record<string, string | number | null | undefined>;

const DRIVER_DEFS = [
  { id: "VER", color: "#3671C6", name: "Verstappen" },
  { id: "LEC", color: "#E8002D", name: "Leclerc" },
  { id: "NOR", color: "#FF8000", name: "Norris" },
  { id: "HAM", color: "#27F4D2", name: "Hamilton" },
] as const;

export function LapChart({
  data,
  minimal = false,
  fillHeight = false,
  showTitle = true,
}: {
  data?: LapData[];
  minimal?: boolean;
  fillHeight?: boolean;
  showTitle?: boolean;
}) {
  const chartUid = useId();
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(["VER", "LEC", "NOR"]);
  
  const isEmpty = !data || data.length === 0;
  const chartData = !isEmpty ? data : Array.from({ length: 57 }, (_, i) => ({
    lap: i + 1,
    ghost1: 90 + Math.sin(i / 5) * 2,
    ghost2: 92 + Math.cos(i / 6) * 1.5,
    ghost3: 88 + Math.sin(i / 4) * 3,
  }));

  const drivers = DRIVER_DEFS;

  const activeDrivers = useMemo(() => {
    if (minimal) return drivers;
    return drivers.filter((d) => selectedDrivers.includes(d.id));
  }, [minimal, selectedDrivers]);

  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length && !isEmpty) {
      return (
        <div className="border border-[var(--border)] bg-[var(--carbon-mid)] p-3 shadow-2xl">
          <p className="mb-2 text-xs font-label uppercase text-[var(--text-secondary)] tracking-widest">Lap {label}</p>
          {payload.map((p) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-6 py-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2" style={{ backgroundColor: p.color }} />
                <span className="font-label font-bold text-[var(--text-primary)] uppercase">{p.dataKey}</span>
              </div>
              <span className="font-tele text-[var(--text-primary)]">{typeof p.value === "number" ? p.value.toFixed(3) : p.value}s</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden ${minimal ? 'p-2' : fillHeight ? 'p-5' : 'p-6'}`}>
      {!minimal && (
        <div className={fillHeight ? "mb-4" : "mb-6"} style={{ paddingLeft: 8, overflow: 'visible' }}>
          {showTitle && (
            <h2 className={`pm-panel-title text-xl ${fillHeight ? "mb-3" : "mb-4"}`}>
              Lap Time Trace
            </h2>
          )}
          
          <div className={`flex flex-wrap gap-2 ${fillHeight ? "mb-3" : "mb-4"} ${showTitle ? "" : "pt-1"}`}>
            {drivers.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDrivers(prev => prev.includes(d.id) ? prev.filter(id => id !== d.id) : [...prev, d.id])}
                className={`flex items-center gap-2 px-3 py-1.5 border font-label text-[11px] font-bold uppercase transition-all clip-para-sm ${
                  selectedDrivers.includes(d.id) 
                  ? "bg-[var(--f1-red-dim)] border-[var(--f1-red)] text-[var(--text-primary)]" 
                  : "bg-[var(--carbon-mid)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                }`}
              >
                <div className="w-2 h-2" style={{ backgroundColor: d.color }} />
                {d.id}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className={`relative flex-1 ${minimal ? 'min-h-[100px]' : fillHeight ? 'min-h-0' : 'min-h-[280px]'}`}>
        {isEmpty && !minimal && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <p className="font-label text-[18px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
              Upload Telemetry to Begin
            </p>
          </div>
        )}
        
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: fillHeight ? 8 : 10, right: 24, left: 12, bottom: fillHeight ? 8 : 16 }}
            >
              <defs>
                {drivers.map((d) => (
                  <linearGradient key={d.id} id={`${chartUid}-stroke-${d.id}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={d.color} stopOpacity={0.60} />
                    <stop offset="45%" stopColor={d.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={d.color} stopOpacity={0.65} />
                  </linearGradient>
                ))}
                <filter id={`${chartUid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="
                      1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 0.55 0
                    "
                    result="glow"
                  />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <CartesianGrid
                strokeDasharray="2 10"
                stroke="rgba(255,255,255,0.10)"
                vertical={false}
              />
              <XAxis 
                dataKey="lap" 
                stroke="var(--text-secondary)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                domain={[1, 57]}
              />
              <YAxis 
                stroke="var(--text-secondary)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(val) => val.toFixed(0) + 's'}
                reversed={true}
                width={40}
                tickMargin={8}
              />
              {!isEmpty && <Tooltip content={<CustomTooltip />} />}
               
              {isEmpty ? (
                <>
                  <Line type="monotone" dataKey="ghost1" stroke="var(--border)" strokeWidth={1} dot={false} opacity={0.2} />
                  <Line type="monotone" dataKey="ghost2" stroke="var(--border)" strokeWidth={1} dot={false} opacity={0.2} />
                  <Line type="monotone" dataKey="ghost3" stroke="var(--border)" strokeWidth={1} dot={false} opacity={0.2} />
                </>
              ) : (
                activeDrivers.map(d => (
                  <Line 
                    key={d.id}
                    type="monotone" 
                    dataKey={d.id} 
                    stroke={`url(#${chartUid}-stroke-${d.id})`}
                    strokeWidth={2.35}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={false} 
                    filter={`url(#${chartUid}-glow)`}
                    activeDot={{ r: 5, strokeWidth: 0, fill: d.color }} 
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
