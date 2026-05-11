import React, { useState } from 'react';
import { Card } from '../ui/card';
import { MessageSquare, Download, FileText, CheckCircle } from 'lucide-react';

export interface StrategyDecision {
  id: string;
  lap: number;
  timestamp: string;
  action: string;
  confidence: number;
  reasoning: string;
  annotation?: string;
  approved: boolean;
  approvedBy?: string;
  outcome?: {
    resultPosition: number;
    resultGap: number;
    notes: string;
  };
}

interface DecisionLogProps {
  decisions?: StrategyDecision[];
  onAddAnnotation?: (decisionId: string, annotation: string) => void;
  onExportSession?: () => void;
}

// Mock decisions from the session
const MOCK_DECISIONS: StrategyDecision[] = [
  {
    id: '1',
    lap: 12,
    timestamp: '00:28:45',
    action: 'Pit Stop (Soft → Hard)',
    confidence: 0.88,
    reasoning: 'Tyre wear accelerating, pit window optimal. Leader not yet committed.',
    annotation: 'Clean pit execution, 2.1s stop',
    approved: true,
    approvedBy: 'Engineer Lead',
    outcome: {
      resultPosition: 2,
      resultGap: 1.2,
      notes: 'Undercut attempt, competitor matched',
    },
  },
  {
    id: '2',
    lap: 23,
    timestamp: '00:54:12',
    action: 'Hold Position',
    confidence: 0.72,
    reasoning: 'P2 tyre gap narrowing. Wait for their pit signal before committing.',
    annotation: 'Good call - P2 pit 2 laps later',
    approved: true,
    approvedBy: 'Strategist',
    outcome: {
      resultPosition: 1,
      resultGap: -0.8,
      notes: 'Gained 2 positions through patience',
    },
  },
  {
    id: '3',
    lap: 35,
    timestamp: '01:22:33',
    action: 'Switch to Conservative Pace',
    confidence: 0.65,
    reasoning: 'Tyre management critical. Low confidence in final stint durability.',
    annotation: 'Borderline call - could have pushed more',
    approved: true,
    approvedBy: 'Engineer Lead',
  },
  {
    id: '4',
    lap: 41,
    timestamp: '01:45:18',
    action: 'Final Push (Soft Tyres)',
    confidence: 0.79,
    reasoning: 'SC deployed lap 38. Fresh softs now optimal for DRS battles.',
    approved: false,
  },
];

export const DecisionLog: React.FC<DecisionLogProps> = ({
  decisions = MOCK_DECISIONS,
  onAddAnnotation,
  onExportSession,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [annotationDraft, setAnnotationDraft] = useState<Record<string, string>>({});

  const handleAddAnnotation = (decisionId: string) => {
    const text = annotationDraft[decisionId];
    if (text?.trim()) {
      onAddAnnotation?.(decisionId, text);
      setAnnotationDraft((prev) => ({ ...prev, [decisionId]: '' }));
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (confidence >= 0.65) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  return (
    <Card className="border-white/10 bg-white/5">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-pit-fg flex items-center gap-2">
              <FileText className="w-5 h-5 text-pit-accent" />
              Decision Log
            </h3>
            <p className="text-xs text-pit-muted mt-1">All strategy calls and outcomes from this session</p>
          </div>
          <button
            onClick={onExportSession}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-pit-fg text-sm font-medium hover:border-white/20 hover:bg-black/30 transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {decisions.map((decision, index) => (
            <div
              key={decision.id}
              className={`relative pb-6 ${index < decisions.length - 1 ? 'border-b border-white/10' : ''}`}
            >
              {/* Timeline marker */}
              <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-pit-accent bg-black/40" />

              {/* Decision card */}
              <div className="ml-8 cursor-pointer" onClick={() => setExpandedId(expandedId === decision.id ? null : decision.id)}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-pit-fg">{decision.action}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-pit-muted">
                      <span>Lap {decision.lap}</span>
                      <span>•</span>
                      <span>{decision.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {decision.approved && (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                    <div
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getConfidenceColor(
                        decision.confidence
                      )}`}
                    >
                      {(decision.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <p className="text-sm text-pit-fg mb-2">{decision.reasoning}</p>

                {/* Annotation badge */}
                {decision.annotation && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pit-accent/10 border border-pit-accent/30 text-[11px] text-pit-accent font-medium">
                    <MessageSquare className="w-3 h-3" />
                    {decision.annotation}
                  </div>
                )}

                {/* Expand indicator */}
                <div className="text-xs text-pit-muted mt-2">{expandedId === decision.id ? '▼' : '▶'} Details</div>
              </div>

              {/* Expanded details */}
              {expandedId === decision.id && (
                <div className="ml-8 mt-4 space-y-4 p-4 rounded-lg border border-white/10 bg-black/20">
                  {/* Approval status */}
                  {decision.approved && (
                    <div className="flex items-center gap-2 text-xs text-emerald-300">
                      <CheckCircle className="w-4 h-4" />
                      <span>Approved by {decision.approvedBy}</span>
                    </div>
                  )}

                  {/* Outcome if available */}
                  {decision.outcome && (
                    <div className="p-3 rounded-lg border border-white/10 bg-black/30">
                      <h5 className="text-xs font-semibold text-pit-fg mb-2">Outcome</h5>
                      <div className="space-y-1 text-xs text-pit-fg">
                        <div className="flex justify-between">
                          <span className="text-pit-muted">Position</span>
                          <span className="font-mono">{decision.outcome.resultPosition}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-pit-muted">Gap to Leader</span>
                          <span className="font-mono">{decision.outcome.resultGap > 0 ? '+' : ''}{decision.outcome.resultGap.toFixed(1)}s</span>
                        </div>
                        <div className="mt-2 text-pit-muted">{decision.outcome.notes}</div>
                      </div>
                    </div>
                  )}

                  {/* Annotation input/display */}
                  <div>
                    <label className="block text-xs font-semibold text-pit-fg mb-2">Engineer Notes</label>
                    {decision.annotation ? (
                      <div className="p-3 rounded-lg bg-pit-accent/5 border border-pit-accent/20 text-xs text-pit-fg">
                        {decision.annotation}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={annotationDraft[decision.id] || ''}
                          onChange={(e) =>
                            setAnnotationDraft((prev) => ({
                              ...prev,
                              [decision.id]: e.target.value,
                            }))
                          }
                          placeholder="Add notes about this decision..."
                          className="w-full h-20 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-pit-fg placeholder:text-pit-muted focus:outline-none focus:border-pit-accent/50 resize-none"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddAnnotation(decision.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-pit-accent text-white text-xs font-medium hover:bg-pit-accent/90 transition"
                        >
                          Save Note
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reasoning detail */}
                  <div className="p-3 rounded-lg border border-white/10 bg-black/30">
                    <h5 className="text-xs font-semibold text-pit-fg mb-2">Full Reasoning</h5>
                    <p className="text-xs text-pit-fg">{decision.reasoning}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary stats */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-pit-muted mb-1">Total Calls</div>
            <div className="text-2xl font-bold text-pit-fg">{decisions.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-pit-muted mb-1">Approved</div>
            <div className="text-2xl font-bold text-emerald-400">{decisions.filter((d) => d.approved).length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-pit-muted mb-1">Avg Confidence</div>
            <div className="text-2xl font-bold text-pit-accent">
              {(
                (decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length) *
                100
              ).toFixed(0)}
              %
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
