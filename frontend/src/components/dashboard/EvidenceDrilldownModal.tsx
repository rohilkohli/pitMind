import React from 'react';
import { Card } from '../ui/card';
import { X, BarChart3, TrendingDown, AlertCircle } from 'lucide-react';

export interface EvidenceDrilldown {
  evidence: string;
  metric: string;
  lapRange: [number, number];
  dataPoints: { lap: number; value: number }[];
  trend: 'improving' | 'degrading' | 'stable';
  confidence: number;
}

interface EvidenceDrilldownModalProps {
  isOpen: boolean;
  evidence?: EvidenceDrilldown;
  onClose: () => void;
}

export const EvidenceDrilldownModal: React.FC<EvidenceDrilldownModalProps> = ({
  isOpen,
  evidence,
  onClose,
}) => {
  if (!isOpen || !evidence) return null;

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-emerald-600';
      case 'degrading':
        return 'text-red-600';
      case 'stable':
        return 'text-slate-600';
      default:
        return 'text-slate-600';
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '↓ Improving';
      case 'degrading':
        return '↑ Degrading';
      case 'stable':
        return '→ Stable';
      default:
        return 'Unknown';
    }
  };

  const stats = evidence.dataPoints.reduce(
    (acc, p) => {
      acc.min = Math.min(acc.min, p.value);
      acc.max = Math.max(acc.max, p.value);
      acc.sum += p.value;
      return acc;
    },
    { min: Infinity, max: -Infinity, sum: 0 }
  );

  const minValue = evidence.dataPoints.length > 0 ? stats.min : Infinity;
  const maxValue = evidence.dataPoints.length > 0 ? stats.max : -Infinity;
  const range = maxValue - minValue || 1;
  const avgValue = evidence.dataPoints.length > 0 ? stats.sum / evidence.dataPoints.length : NaN;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-f1-black/80" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl border border-f1-border bg-f1-black p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-f1-muted hover:text-f1-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 border-l-4 border-f1-red pl-4">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-2xl font-display font-black uppercase text-f1-white">{evidence.metric}</h2>
            <div className={`px-3 py-1 text-sm font-bold uppercase tracking-widest ${getTrendColor(evidence.trend)} bg-f1-dark border border-f1-border`}>
              {getTrendLabel(evidence.trend)}
            </div>
          </div>
          <p className="text-f1-secondary">{evidence.evidence}</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-f1-dark border border-f1-border">
            <div className="text-xs text-f1-muted mb-1 uppercase tracking-widest">Lap Range</div>
            <div className="text-lg font-display font-black text-f1-white">
              {evidence.lapRange[0]}—{evidence.lapRange[1]}
            </div>
          </div>
          <div className="p-3 bg-f1-dark border border-f1-border">
            <div className="text-xs text-f1-muted mb-1 uppercase tracking-widest">Data Points</div>
            <div className="text-lg font-display font-black text-f1-white">{evidence.dataPoints.length}</div>
          </div>
          <div className="p-3 bg-f1-dark border border-f1-border">
            <div className="text-xs text-f1-muted mb-1 uppercase tracking-widest">Avg Value</div>
            <div className="text-lg font-display font-black text-f1-white">{avgValue.toFixed(1)}</div>
          </div>
          <div className="p-3 bg-f1-dark border border-f1-border">
            <div className="text-xs text-f1-muted mb-1 uppercase tracking-widest">Confidence</div>
            <div className="text-lg font-display font-black text-f1-white">{(evidence.confidence * 100).toFixed(0)}%</div>
          </div>
        </div>

        {/* Chart-like visualization */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-f1-white mb-3 flex items-center gap-2 uppercase tracking-widest">
            <BarChart3 className="w-4 h-4" />
            Metric Timeline
          </h3>
          <div className="relative h-40 p-4 bg-f1-dark border border-f1-border">
            {/* Y-axis labels */}
            <div className="absolute left-2 top-2 text-[10px] text-f1-muted font-mono">
              {maxValue.toFixed(1)}
            </div>
            <div className="absolute left-2 bottom-2 text-[10px] text-f1-muted font-mono">
              {minValue.toFixed(1)}
            </div>

            {/* Mini chart bars */}
            <div className="absolute inset-4 left-10 flex items-end justify-around gap-1">
              {evidence.dataPoints.map((point, idx) => {
                const normalizedValue = (point.value - minValue) / range;
                const heightPercent = normalizedValue * 100;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1 group"
                  >
                    <div
                      className={`w-full transition-all ${
                        evidence.trend === 'improving'
                          ? 'bg-inter'
                          : evidence.trend === 'degrading'
                          ? 'bg-f1-red'
                          : 'bg-f1-muted'
                      } hover:opacity-80 cursor-help`}
                      style={{ height: `${Math.max(heightPercent, 5)}%` }}
                      title={`Lap ${point.lap}: ${point.value.toFixed(1)}`}
                    />
                    <div className="text-[9px] text-f1-muted font-mono">{point.lap}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 text-xs text-f1-muted">
            Shows metric values across the lap range. Hover bars to see exact values.
          </div>
        </div>

        {/* Min/Max/Trend details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-f1-dark border border-f1-border">
            <div className="flex items-start gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-inter mt-0.5" />
              <div>
                <div className="text-sm font-bold text-f1-white uppercase tracking-widest">Best Value</div>
                <div className="text-2xl font-display font-black text-inter">{minValue.toFixed(1)}</div>
              </div>
            </div>
            <p className="text-xs text-f1-muted">Lowest recorded metric value in range</p>
          </Card>

          <Card className="p-4 bg-f1-dark border border-f1-border">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-f1-red mt-0.5" />
              <div>
                <div className="text-sm font-bold text-f1-white uppercase tracking-widest">Worst Value</div>
                <div className="text-2xl font-display font-black text-f1-red">{maxValue.toFixed(1)}</div>
              </div>
            </div>
            <p className="text-xs text-f1-muted">Highest recorded metric value in range</p>
          </Card>
        </div>

        {/* Interpretation */}
        <div className="p-4 bg-f1-dark border border-f1-border mb-6">
          <h3 className="text-sm font-bold text-f1-white mb-2 uppercase tracking-widest">Interpretation</h3>
          <p className="text-sm text-f1-secondary">
            {evidence.trend === 'improving'
              ? 'This metric is showing improvement across the analyzed laps, indicating positive performance trajectory.'
              : evidence.trend === 'degrading'
              ? 'This metric is degrading over time, suggesting wear, fuel load, or grip loss. Consider immediate strategic action.'
              : 'This metric is stable, indicating consistent performance without significant changes.'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-f1-border text-f1-white font-bold uppercase tracking-widest hover:bg-f1-dark transition"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-f1-red text-white font-bold uppercase tracking-widest hover:bg-f1-red-dark transition"
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};
