import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

export function LapChart({ data, minimal = false }: { data?: any[]; minimal?: boolean }) {
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(["VER", "LEC", "NOR"]);

  const isEmpty = !data || data.length === 0;
  const chartData = !isEmpty
    ? data
    : Array.from({ length: 57 }, (_, i) => ({
        lap: i + 1,
        ghost1: 90 + Math.sin(i / 5) * 2,
        ghost2: 92 + Math.cos(i / 6) * 1.5,
        ghost3: 88 + Math.sin(i / 4) * 3,
      }));

  const drivers = [
    { id: "VER", color: "#3671C6", name: "Verstappen" },
    { id: "LEC", color: "#E8002D", name: "Leclerc" },
    { id: "NOR", color: "#FF8000", name: "Norris" },
    { id: "HAM", color: "#27F4D2", name: "Hamilton" },
  ];

  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length && !isEmpty) {
      return (
        <div className="border border-[var(--border)] bg-[var(--carbon-mid)] p-3 shadow-2xl">
          <p className="mb-2 text-xs font-label uppercase text-[var(--text-secondary)] tracking-widest">
            Lap {label}
          </p>
          {payload.map((p) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-6 py-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2" style={{ backgroundColor: p.color }} />
                <span className="font-label font-bold text-[var(--text-primary)] uppercase">
                  {p.dataKey}
                </span>
              </div>
              <span className="font-tele text-[var(--text-primary)]">
                {typeof p.value === "number" ? p.value.toFixed(3) : p.value}s
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`flex h-full flex-col ${minimal ? "p-2" : "p-6"}`}>
      {!minimal && (
        <div className="mb-6">
          <h2 className="pm-panel-title text-xl mb-4">Lap Time Trace</h2>

          <div className="flex flex-wrap gap-2 mb-4">
            {drivers.map((d) => (
              <button
                key={d.id}
                onClick={() =>
                  setSelectedDrivers((prev) =>
                    prev.includes(d.id) ? prev.filter((id) => id !== d.id) : [...prev, d.id],
                  )
                }
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

      <div className={`relative flex-1 ${minimal ? "min-h-[100px]" : "min-h-[400px]"}`}>
        {isEmpty && !minimal && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <p className="font-label text-[18px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
              Upload Telemetry to Begin
            </p>
          </div>
        )}

        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
                opacity={0.3}
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
                domain={["auto", "auto"]}
                tickFormatter={(val) => val.toFixed(0) + "s"}
                reversed={true}
              />
              {!isEmpty && <Tooltip content={<CustomTooltip />} />}

              {isEmpty ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="ghost1"
                    stroke="var(--border)"
                    strokeWidth={1}
                    dot={false}
                    opacity={0.2}
                  />
                  <Line
                    type="monotone"
                    dataKey="ghost2"
                    stroke="var(--border)"
                    strokeWidth={1}
                    dot={false}
                    opacity={0.2}
                  />
                  <Line
                    type="monotone"
                    dataKey="ghost3"
                    stroke="var(--border)"
                    strokeWidth={1}
                    dot={false}
                    opacity={0.2}
                  />
                </>
              ) : (
                drivers
                  .filter((d) => minimal || selectedDrivers.includes(d.id))
                  .map((d) => (
                    <Line
                      key={d.id}
                      type="monotone"
                      dataKey={d.id}
                      stroke={d.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
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
