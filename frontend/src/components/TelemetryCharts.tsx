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

type WearRow = { lap: number; wear: number | null };
type GapRow = { lap: number; gap: number | null };

type Props = {
  wearSeries: WearRow[];
  gapSeries: GapRow[];
};

export function TelemetryCharts({ wearSeries, gapSeries }: Props) {
  const wearTableLabelId = "wear-table-title";
  const gapTableLabelId = "gap-table-title";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <figure className="rounded-xl border border-pit-stroke bg-black/30 p-3" aria-labelledby={wearTableLabelId}>
        <figcaption id={wearTableLabelId} className="mb-2 text-sm font-semibold text-pit-fg">
          Tyre degradation curve
        </figcaption>
        <div className="h-64" role="img" aria-label="Tyre wear versus lap chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={wearSeries}>
              <CartesianGrid stroke="#2a2a2f" strokeDasharray="4 4" />
              <XAxis dataKey="lap" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: "#121214", border: "1px solid #2a2a2f", color: "#f4f4f5" }}
              />
              <Legend />
              <Line type="monotone" dataKey="wear" stroke="#e10600" dot={false} name="Wear %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <table className="mt-3 w-full text-left text-xs text-pit-muted" aria-label="Tyre wear data table">
          <caption className="sr-only">Tyre wear per lap</caption>
          <thead>
            <tr className="border-b border-pit-stroke">
              <th scope="col" className="py-1 font-mono">
                Lap
              </th>
              <th scope="col" className="py-1 font-mono">
                Wear %
              </th>
            </tr>
          </thead>
          <tbody>
            {wearSeries.slice(-6).map((row) => (
              <tr key={row.lap} className="border-b border-pit-stroke/60">
                <td className="py-1 font-mono">{row.lap}</td>
                <td className="py-1 font-mono">{row.wear ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>

      <figure className="rounded-xl border border-pit-stroke bg-black/30 p-3" aria-labelledby={gapTableLabelId}>
        <figcaption id={gapTableLabelId} className="mb-2 text-sm font-semibold text-pit-fg">
          Gap delta ahead (seconds)
        </figcaption>
        <div className="h-64" role="img" aria-label="Gap ahead versus lap chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gapSeries}>
              <CartesianGrid stroke="#2a2a2f" strokeDasharray="4 4" />
              <XAxis dataKey="lap" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <Tooltip
                contentStyle={{ background: "#121214", border: "1px solid #2a2a2f", color: "#f4f4f5" }}
              />
              <Legend />
              <Line type="monotone" dataKey="gap" stroke="#fafafa" dot={false} name="Gap (s)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <table className="mt-3 w-full text-left text-xs text-pit-muted" aria-label="Gap data table">
          <caption className="sr-only">Gap ahead per lap</caption>
          <thead>
            <tr className="border-b border-pit-stroke">
              <th scope="col" className="py-1 font-mono">
                Lap
              </th>
              <th scope="col" className="py-1 font-mono">
                Gap (s)
              </th>
            </tr>
          </thead>
          <tbody>
            {gapSeries.slice(-6).map((row) => (
              <tr key={row.lap} className="border-b border-pit-stroke/60">
                <td className="py-1 font-mono">{row.lap}</td>
                <td className="py-1 font-mono">{row.gap ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    </div>
  );
}
