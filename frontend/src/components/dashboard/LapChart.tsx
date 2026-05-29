import { useId, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

export type LapData = { lap: number } & Record<string, string | number | null | undefined>;

const DRIVER_DEFS = [
  { id: "VER", color: "#3B82F6", name: "Verstappen", team: "Red Bull" },
  { id: "LEC", color: "#E10600", name: "Leclerc", team: "Ferrari" },
  { id: "NOR", color: "#FF8000", name: "Norris", team: "McLaren" },
  { id: "HAM", color: "#00D2BE", name: "Hamilton", team: "Mercedes" },
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
  const [hoveredLap, setHoveredLap] = useState<number | null>(null);

  const isEmpty = !data || data.length === 0;
  const chartData = !isEmpty
    ? data
    : Array.from({ length: 57 }, (_, i) => ({
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
        <div
          style={{
            background: "linear-gradient(135deg, rgba(14,14,16,0.97) 0%, rgba(22,22,26,0.97) 100%)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderTop: "1px solid rgba(255,255,255,0.16)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            padding: "12px 16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(225,6,0,0.15)",
            minWidth: 160,
          }}
        >
          <p
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            Lap {label}
          </p>
          {payload.map((p) => {
            const driver = drivers.find((d) => d.id === p.dataKey);
            return (
              <div
                key={p.dataKey as string}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "4px 0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 3, height: 14, background: p.color, borderRadius: 1 }} />
                  <div>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {p.dataKey}
                    </span>
                    {driver && (
                      <span
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: 9,
                          color: "var(--text-secondary)",
                          marginLeft: 4,
                          textTransform: "uppercase",
                        }}
                      >
                        {driver.team}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {typeof p.value === "number" ? p.value.toFixed(3) : p.value}s
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden ${minimal ? "p-2" : fillHeight ? "p-4" : "p-6"}`}
    >
      {!minimal && (
        <div className={fillHeight ? "mb-3" : "mb-6"} style={{ paddingLeft: 4 }}>
          {showTitle && (
            <h2 className={`pm-panel-title text-xl ${fillHeight ? "mb-3" : "mb-4"}`}>
              Lap Time Trace
            </h2>
          )}

          {/* Driver Filter Buttons */}
          <div
            className={`flex flex-wrap gap-2 ${fillHeight ? "mb-2" : "mb-4"} ${showTitle ? "" : "pt-1"}`}
          >
            {drivers.map((d) => {
              const isActive = selectedDrivers.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() =>
                    setSelectedDrivers((prev) =>
                      prev.includes(d.id) ? prev.filter((id) => id !== d.id) : [...prev, d.id],
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "5px 10px",
                    border: `1px solid ${isActive ? d.color : "rgba(255,255,255,0.10)"}`,
                    background: isActive ? `${d.color}18` : "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(8px)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: isActive ? d.color : "transparent",
                      border: `1.5px solid ${d.color}`,
                      boxShadow: isActive ? `0 0 6px ${d.color}88` : "none",
                      transition: "all 0.15s ease",
                    }}
                  />
                  {d.id}
                  <span style={{ fontSize: 9, color: "var(--text-secondary)", fontWeight: 500 }}>
                    {d.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        className={`relative flex-1 ${minimal ? "min-h-[100px]" : fillHeight ? "min-h-0" : "min-h-[280px]"}`}
        style={{ borderRadius: 0 }}
      >
        {isEmpty && !minimal && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.3em",
                }}
              >
                Upload Telemetry to Begin
              </p>
              <p
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.2)",
                  marginTop: 4,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Live data will appear automatically
              </p>
            </div>
          </div>
        )}

        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 20, left: 8, bottom: fillHeight ? 8 : 16 }}
              onMouseMove={(e) => {
                if (e.activeLabel) setHoveredLap(Number(e.activeLabel));
              }}
              onMouseLeave={() => setHoveredLap(null)}
            >
              <defs>
                {/* Gradient backgrounds for each driver line */}
                {drivers.map((d) => (
                  <linearGradient
                    key={d.id}
                    id={`${chartUid}-stroke-${d.id}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor={d.color} stopOpacity={0.4} />
                    <stop offset="30%" stopColor={d.color} stopOpacity={0.9} />
                    <stop offset="70%" stopColor={d.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={d.color} stopOpacity={0.5} />
                  </linearGradient>
                ))}

                {/* Enhanced glow filter */}
                <filter id={`${chartUid}-glow`} x="-30%" y="-50%" width="160%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur1" />
                  <feGaussianBlur stdDeviation="1" result="blur2" />
                  <feColorMatrix
                    in="blur1"
                    type="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0"
                    result="glow1"
                  />
                  <feColorMatrix
                    in="blur2"
                    type="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0"
                    result="glow2"
                  />
                  <feMerge>
                    <feMergeNode in="glow1" />
                    <feMergeNode in="glow2" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Area gradient for background fill effect */}
                <linearGradient id={`${chartUid}-area-fade`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>

              {/* Subtle grid */}
              <CartesianGrid
                strokeDasharray="1 14"
                stroke="rgba(255,255,255,0.05)"
                vertical={true}
                horizontal={true}
              />

              <XAxis
                dataKey="lap"
                stroke="rgba(255,255,255,0.2)"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                domain={[1, 57]}
                tick={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fill: "var(--text-secondary)",
                  letterSpacing: "0.08em",
                }}
                label={{
                  value: "LAP",
                  position: "insideBottomRight",
                  offset: -4,
                  style: {
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 9,
                    fill: "rgba(255,255,255,0.2)",
                    letterSpacing: "0.2em",
                  },
                }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                domain={["auto", "auto"]}
                tickFormatter={(val) => val.toFixed(0) + "s"}
                reversed={true}
                width={38}
                tickMargin={8}
                tick={{
                  fontFamily: "'Orbitron', sans-serif",
                  fill: "var(--text-secondary)",
                  fontSize: 8,
                }}
              />

              {!isEmpty && (
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "rgba(255,255,255,0.08)",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
              )}

              {/* Hovered lap reference line */}
              {hoveredLap && !isEmpty && (
                <ReferenceLine
                  x={hoveredLap}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                />
              )}

              {isEmpty ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="ghost1"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ghost2"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ghost3"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </>
              ) : (
                activeDrivers.map((d) => (
                  <Line
                    key={d.id}
                    type="monotone"
                    dataKey={d.id}
                    stroke={`url(#${chartUid}-stroke-${d.id})`}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={false}
                    filter={`url(#${chartUid}-glow)`}
                    activeDot={{
                      r: 5,
                      strokeWidth: 1.5,
                      stroke: "rgba(255,255,255,0.5)",
                      fill: d.color,
                      filter: `drop-shadow(0 0 6px ${d.color}cc)`,
                    }}
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Corner decorations */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 20,
            height: 20,
            borderTop: "1px solid rgba(225,6,0,0.3)",
            borderLeft: "1px solid rgba(225,6,0,0.3)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 20,
            height: 20,
            borderTop: "1px solid rgba(225,6,0,0.3)",
            borderRight: "1px solid rgba(225,6,0,0.3)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 20,
            height: 20,
            borderBottom: "1px solid rgba(225,6,0,0.3)",
            borderLeft: "1px solid rgba(225,6,0,0.3)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 20,
            height: 20,
            borderBottom: "1px solid rgba(225,6,0,0.3)",
            borderRight: "1px solid rgba(225,6,0,0.3)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
