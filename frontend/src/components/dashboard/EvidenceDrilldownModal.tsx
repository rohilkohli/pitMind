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

  const minValue = Math.min(...evidence.dataPoints.map((p) => p.value));
  const maxValue = Math.max(...evidence.dataPoints.map((p) => p.value));
  const range = maxValue - minValue || 1;
  const avgValue = evidence.dataPoints.reduce((sum, p) => sum + p.value, 0) / evidence.dataPoints.length;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-2xl font-bold text-slate-900">{evidence.metric}</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getTrendColor(evidence.trend)} bg-slate-50`}>
              {getTrendLabel(evidence.trend)}
            </div>
          </div>
          <p className="text-slate-700">{evidence.evidence}</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-600 mb-1">Lap Range</div>
            <div className="text-lg font-bold text-slate-900">
              {evidence.lapRange[0]}—{evidence.lapRange[1]}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-600 mb-1">Data Points</div>
            <div className="text-lg font-bold text-slate-900">{evidence.dataPoints.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-600 mb-1">Avg Value</div>
            <div className="text-lg font-bold text-slate-900">{avgValue.toFixed(1)}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-600 mb-1">Confidence</div>
            <div className="text-lg font-bold text-slate-900">{(evidence.confidence * 100).toFixed(0)}%</div>
          </div>
        </div>

        {/* Chart-like visualization */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Metric Timeline
          </h3>
          <div className="relative h-40 p-4 bg-slate-50 rounded-lg border border-slate-200">
            {/* Y-axis labels */}
            <div className="absolute left-2 top-2 text-[10px] text-slate-600 font-mono">
              {maxValue.toFixed(1)}
            </div>
            <div className="absolute left-2 bottom-2 text-[10px] text-slate-600 font-mono">
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
                      className={`w-full rounded-t transition-all ${
                        evidence.trend === 'improving'
                          ? 'bg-emerald-400'
                          : evidence.trend === 'degrading'
                          ? 'bg-red-400'
                          : 'bg-slate-400'
                      } hover:opacity-80 cursor-help`}
                      style={{ height: `${Math.max(heightPercent, 5)}%` }}
                      title={`Lap ${point.lap}: ${point.value.toFixed(1)}`}
                    />
                    <div className="text-[9px] text-slate-600 font-mono">{point.lap}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Shows metric values across the lap range. Hover bars to see exact values.
          </div>
        </div>

        {/* Min/Max/Trend details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-start gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-emerald-600 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-emerald-900">Best Value</div>
                <div className="text-2xl font-bold text-emerald-600">{minValue.toFixed(1)}</div>
              </div>
            </div>
            <p className="text-xs text-emerald-700">Lowest recorded metric value in range</p>
          </Card>

          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-red-900">Worst Value</div>
                <div className="text-2xl font-bold text-red-600">{maxValue.toFixed(1)}</div>
              </div>
            </div>
            <p className="text-xs text-red-700">Highest recorded metric value in range</p>
          </Card>
        </div>

        {/* Interpretation */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Interpretation</h3>
          <p className="text-sm text-slate-700">
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
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};
