import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = { lap: number; a: number | null; b: number | null };

type Props = {
  title: string;
  data: Row[];
  metricLabel: string;
};

export function CompareTelemetryChart({ title, data, metricLabel }: Props) {
  const labelId = `${title.replace(/\s+/g, "-").toLowerCase()}-title`;
  return (
    <figure className="rounded-xl border border-pit-stroke bg-black/30 p-3" aria-labelledby={labelId}>
      <figcaption id={labelId} className="mb-2 text-sm font-semibold text-pit-fg">
        {title}
      </figcaption>
      <div className="h-64" role="img" aria-label={`${metricLabel} comparison chart`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#2a2a2f" strokeDasharray="4 4" />
            <XAxis dataKey="lap" stroke="#a1a1aa" />
            <YAxis stroke="#a1a1aa" />
            <Tooltip
              contentStyle={{ background: "#121214", border: "1px solid #2a2a2f", color: "#f4f4f5" }}
            />
            <Legend />
            <Line type="monotone" dataKey="a" stroke="#e10600" dot={false} name="Driver A" />
            <Line type="monotone" dataKey="b" stroke="#fafafa" dot={false} name="Driver B" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className="mt-3 w-full text-left text-xs text-pit-muted" aria-label={`${metricLabel} table`}>
        <caption className="sr-only">{metricLabel} sample rows</caption>
        <thead>
          <tr className="border-b border-pit-stroke">
            <th scope="col" className="py-1 font-mono">
              Lap
            </th>
            <th scope="col" className="py-1 font-mono">
              A
            </th>
            <th scope="col" className="py-1 font-mono">
              B
            </th>
          </tr>
        </thead>
        <tbody>
          {data.slice(-6).map((row) => (
            <tr key={row.lap} className="border-b border-pit-stroke/60">
              <td className="py-1 font-mono">{row.lap}</td>
              <td className="py-1 font-mono">{row.a ?? "—"}</td>
              <td className="py-1 font-mono">{row.b ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
