import React, { useState } from "react";
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
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(["VER", "LEC", "NOR"]);
  
  const isEmpty = !data || data.length === 0;
  const chartData = !isEmpty ? data : Array.from({ length: 57 }, (_, i) => ({
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
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h2 className="f1-section-title !mb-4">Lap Time Trace</h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {drivers.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDrivers(prev => prev.includes(d.id) ? prev.filter(id => id !== d.id) : [...prev, d.id])}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase transition-all ${
                selectedDrivers.includes(d.id) 
                ? "bg-f1-red/10 border-f1-red text-white" 
                : "bg-transparent border-[#38383F] text-[#67676D] hover:border-[#67676D]"
              }`}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              {d.id}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative min-h-[400px] flex-1">
        {isEmpty && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <p className="text-[18px] font-display font-semibold text-[#67676D] uppercase tracking-widest">
              Upload Telemetry to Begin
            </p>
          </div>
        )}
        
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#38383F" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="lap" 
              stroke="#67676D" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              domain={[1, 57]}
            />
            <YAxis 
              stroke="#67676D" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              domain={[85, 100]}
              tickFormatter={(val) => val.toFixed(0) + 's'}
              reversed={true}
            />
            {!isEmpty && <Tooltip content={<CustomTooltip />} />}
            
            {isEmpty ? (
              <>
                <Line type="monotone" dataKey="ghost1" stroke="#38383F" strokeWidth={1} dot={false} opacity={0.2} />
                <Line type="monotone" dataKey="ghost2" stroke="#38383F" strokeWidth={1} dot={false} opacity={0.2} />
                <Line type="monotone" dataKey="ghost3" stroke="#38383F" strokeWidth={1} dot={false} opacity={0.2} />
              </>
            ) : (
              drivers.filter(d => selectedDrivers.includes(d.id)).map(d => (
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
  );
}
