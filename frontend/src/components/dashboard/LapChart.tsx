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

export function LapChart({ data }: { data?: any[] }) {
  const chartData = data && data.length > 0 ? data : mockData;
  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="border border-f1-border bg-f1-dark p-3 shadow-[0_12px_36px_rgba(0,0,0,0.45)]">
          <p className="mb-2 text-xs font-bold uppercase text-f1-muted">Lap {label}</p>
          {payload.map((p) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-4 py-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="font-bold text-f1-white">{p.dataKey}</span>
              </div>
              <span className="f1-mono text-f1-white">{typeof p.value === "number" ? p.value.toFixed(3) : p.value}s</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 bg-f1-dark pb-2 pt-4 border-b border-f1-border">
        <div className="flex items-center justify-between px-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-f1-muted">Lap Time Trace</h2>
            <p className="mt-1 text-xs text-f1-muted">Live telemetry analysis</p>
          </div>
          <span className="border border-f1-border bg-f1-elevated px-3 py-1 text-xs text-f1-muted">Live</span>
        </div>
      </div>
      
      <div className="min-h-[300px] flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#38383F" vertical={false} opacity={0.5} />
            <XAxis 
              dataKey="lap" 
              stroke="#67676D" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
            />
            {/* Inverse Y-axis so faster (lower) times are higher on the chart visually */}
            <YAxis 
              stroke="#67676D" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              domain={['dataMin - 1', 'dataMax + 1']}
              tickFormatter={(val) => val.toFixed(1)}
              reversed={true}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#67676D' }} />
            <Line type="monotone" dataKey="VER" stroke="#0600ef" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="LEC" stroke="#dc0000" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="NOR" stroke="#FF8000" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
