import React from 'react';
import { Card } from '../ui/card';
import type { ConfidenceDecomposition } from '../../services/api';

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
      <Card className="p-6 text-center border-white/10 bg-white/5">
        <p className="text-f1-secondary text-sm font-medium">Run strategy analysis to see confidence breakdown</p>
      </Card>
    );
  }

  const getConfidenceColor = (value: number) => {
    if (value >= 70) return '#39B54A';
    if (value >= 40) return '#FFC906';
    return '#E10600';
  };

  return (
    <Card className="p-6">
      <h3 className="f1-section-title text-lg">Confidence Analysis</h3>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-f1-secondary text-[10px] font-black uppercase tracking-widest opacity-80">OVERALL CONFIDENCE</span>
          <span className="font-display font-black text-f1-white text-lg">{overallConfidence.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 bg-f1-border">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${Math.min(overallConfidence, 100)}%`, backgroundColor: getConfidenceColor(overallConfidence) }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-l-2 border-f1-red pl-3">
          <p className="text-f1-secondary text-[10px] font-black uppercase tracking-widest opacity-80">Data Quality</p>
          <div className="flex justify-between items-center mt-2">
            <span className="font-display font-black text-f1-white text-base">{decomposition.data_quality.toFixed(0)}%</span>
            <div className="flex-1 ml-4 h-1 bg-f1-border">
              <div className="h-full" style={{ width: `${decomposition.data_quality}%`, backgroundColor: getConfidenceColor(decomposition.data_quality) }} />
            </div>
          </div>
        </div>

        <div className="border-l-2 border-f1-red pl-3">
          <p className="text-f1-secondary text-[10px] font-black uppercase tracking-widest opacity-80">Model Certainty</p>
          <div className="flex justify-between items-center mt-2">
            <span className="font-display font-black text-f1-white text-base">{decomposition.model_certainty.toFixed(0)}%</span>
            <div className="flex-1 ml-4 h-1 bg-f1-border">
              <div className="h-full" style={{ width: `${decomposition.model_certainty}%`, backgroundColor: getConfidenceColor(decomposition.model_certainty) }} />
            </div>
          </div>
        </div>

        <div className="border-l-2 border-f1-red pl-3">
          <p className="text-f1-secondary text-[10px] font-black uppercase tracking-widest opacity-80">Stability</p>
          <div className="flex justify-between items-center mt-2">
            <span className="font-display font-black text-f1-white text-base">{decomposition.stability.toFixed(0)}%</span>
            <div className="flex-1 ml-4 h-1 bg-f1-border">
              <div className="h-full" style={{ width: `${decomposition.stability}%`, backgroundColor: getConfidenceColor(decomposition.stability) }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-f1-elevated border-l-2 border-f1-red">
        <p className="text-[10px] font-black uppercase tracking-widest text-f1-secondary opacity-80 mb-2">Assessment</p>
        {overallConfidence >= 70 ? (
          <p className="text-sm text-f1-secondary">
            <span className="font-bold">HIGH CONFIDENCE</span> — Strategy well-supported. Safe to execute immediately.
          </p>
        ) : overallConfidence >= 40 ? (
          <p className="text-sm text-f1-secondary">
            <span className="font-bold">MODERATE CONFIDENCE</span> — Good strategy. Consider alternatives.
          </p>
        ) : (
          <p className="text-sm text-f1-secondary">
            <span className="font-bold">LOW CONFIDENCE</span> — High uncertainty. Collect more telemetry.
          </p>
        )}
      </div>
    </Card>
  );
};
