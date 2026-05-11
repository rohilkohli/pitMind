import React from 'react';
import { Card } from '../ui/card';
import type { ConfidenceDecomposition } from '../../services/api';
import { TrendingUp, Database, Brain, Activity } from 'lucide-react';

interface ConfidenceDecompositionCardProps {
  decomposition?: ConfidenceDecomposition | null;
  overallConfidence?: number;
}

export const ConfidenceDecompositionCard: React.FC<ConfidenceDecompositionCardProps> = ({
  decomposition,
  overallConfidence = 0,
}) => {
  if (!decomposition) {
    return (
      <Card className="p-6 text-center text-slate-500">
        <div className="flex justify-center mb-3">
          <Brain className="w-8 h-8 opacity-30" />
        </div>
        <p>Run strategy analysis to see confidence breakdown</p>
      </Card>
    );
  }

  const metrics = [
    {
      label: 'Data Quality',
      value: decomposition.data_quality,
      icon: Database,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Telemetry completeness & reliability',
    },
    {
      label: 'Model Certainty',
      value: decomposition.model_certainty,
      icon: Brain,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Confidence in predictions',
    },
    {
      label: 'Stability',
      value: decomposition.stability,
      icon: Activity,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      description: 'Consistency across scenarios',
    },
    {
      label: 'Regret Bound',
      value: (1 - decomposition.regret_bound) * 100, // Convert to percentage for display
      icon: TrendingUp,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      description: 'Expected optimality (higher is better)',
    },
  ];

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Confidence Decomposition</h3>
        <p className="text-sm text-slate-600">
          Overall confidence: <span className="font-bold text-slate-900">{overallConfidence.toFixed(0)}%</span>
        </p>
      </div>

      {/* Overall confidence bar */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Confidence Score</span>
          <span className="text-lg font-bold text-slate-900">{overallConfidence.toFixed(0)}%</span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-slate-600 to-slate-500 transition-all duration-300"
            style={{ width: `${Math.min(overallConfidence, 100)}%` }}
          />
        </div>
      </div>

      {/* Decomposition metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const percentage = Math.min(metric.value, 100);

          return (
            <div
              key={metric.label}
              className={`p-4 rounded-lg border-2 ${metric.borderColor} ${metric.bgColor}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                  <h4 className="font-semibold text-slate-900">{metric.label}</h4>
                </div>
                <span className="text-lg font-bold text-slate-900">{percentage.toFixed(0)}%</span>
              </div>

              <p className="text-xs text-slate-600 mb-3">{metric.description}</p>

              {/* Mini bar chart */}
              <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-white/50">
                <div
                  className={`h-full transition-all duration-300 ${
                    metric.label === 'Data Quality'
                      ? 'bg-blue-500'
                      : metric.label === 'Model Certainty'
                      ? 'bg-purple-500'
                      : metric.label === 'Stability'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Confidence interpretation */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
          Interpretation
        </p>
        {overallConfidence >= 80 ? (
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-emerald-700">High confidence</span> — Strategy is well-supported by data
            and consistent across scenarios. Safe to recommend immediate action.
          </p>
        ) : overallConfidence >= 60 ? (
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-amber-700">Moderate confidence</span> — Reasonable strategy but some
            uncertainty remains. Consider cross-checking with alternative strategies.
          </p>
        ) : (
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-red-700">Low confidence</span> — Significant uncertainty in
            recommendation. Recommend collecting more data or manual review.
          </p>
        )}
      </div>
    </Card>
  );
};
