import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

const mockData = Array.from({ length: 30 }, (_, i) => {
  const lap = i + 1;
  const trend = i < 10 ? 0.18 : i < 20 ? 0.08 : -0.02;

  return {
    lap,
    VER: 82.4 + trend + Math.sin(i / 3) * 0.08,
    LEC: 82.9 + trend + Math.cos(i / 4) * 0.07,
    NOR: 83.1 + trend + Math.sin(i / 5) * 0.06,
  };
});

export function LapChart() {
  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl border border-white/10 bg-black/90 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.45)] backdrop-blur">
          <p className="mb-2 text-xs font-semibold uppercase text-pit-muted">Lap {label}</p>
          {payload.map((p) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-4 py-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="font-semibold text-pit-fg">{p.dataKey}</span>
              </div>
              <span className="font-mono text-pit-fg">{typeof p.value === "number" ? p.value.toFixed(3) : p.value}s</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 bg-carbon/80 pb-2 pt-4 backdrop-blur">
        <div className="flex items-center justify-between px-4">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.32em] text-pit-muted">Lap Time Trace</h2>
            <p className="mt-1 text-xs text-pit-muted">Smoothed demo trend that stays stable across renders</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-pit-muted">Demo telemetry</span>
        </div>
      </div>
      
      <div className="min-h-[300px] flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--pit-stroke)" vertical={false} />
            <XAxis 
              dataKey="lap" 
              stroke="var(--pit-muted)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
            />
            {/* Inverse Y-axis so faster (lower) times are higher on the chart visually */}
            <YAxis 
              stroke="var(--pit-muted)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              domain={['dataMin - 1', 'dataMax + 1']}
              tickFormatter={(val) => val.toFixed(1)}
              reversed={true}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--pit-muted)' }} />
            <Line type="monotone" dataKey="VER" stroke="#0600ef" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="LEC" stroke="#dc0000" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="NOR" stroke="#ff8700" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
