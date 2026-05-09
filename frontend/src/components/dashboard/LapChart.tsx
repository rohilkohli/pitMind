import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function LapChart() {
  // Placeholder data for the chart layout
  const mockData = Array.from({ length: 30 }, (_, i) => ({
    lap: i + 1,
    VER: 82.5 - Math.random() * 2,
    LEC: 83.0 - Math.random() * 2,
    NOR: 83.2 - Math.random() * 2,
  }));

  // Recharts custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-pit-stroke bg-black/90 p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold uppercase text-pit-muted">Lap {label}</p>
          {payload.map((p: any) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-4 py-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="font-semibold text-pit-fg">{p.dataKey}</span>
              </div>
              <span className="font-mono text-pit-fg">{p.value.toFixed(3)}s</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 bg-carbon pb-2 pt-4">
        <h2 className="px-4 text-[11px] font-semibold uppercase tracking-widest text-pit-muted">Lap Time Trace</h2>
      </div>
      
      <div className="flex-1 p-4 min-h-[300px]">
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
