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
    if (confidence >= 0.8) return 'bg-inter/20 text-inter border-inter/30';
    if (confidence >= 0.65) return 'bg-medium/20 text-medium border-medium/30';
    return 'bg-f1-red/20 text-f1-red border-f1-red/30';
  };

  return (
    <Card className="border-f1-border bg-f1-black">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-f1-white flex items-center gap-2 uppercase tracking-widest">
              <FileText className="w-5 h-5 text-f1-red" />
              Decision Log
            </h3>
            <p className="text-xs text-f1-muted mt-1 uppercase tracking-widest">All strategy calls and outcomes from this session</p>
          </div>
          <button
            onClick={onExportSession}
            className="flex items-center gap-2 px-3 py-2 border border-f1-border bg-f1-dark text-f1-white text-sm font-bold uppercase tracking-widest hover:bg-f1-elevated transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="space-y-4">
          {decisions.map((decision, index) => (
            <div
              key={decision.id}
              className={`relative pb-6 ${index < decisions.length - 1 ? 'border-b border-f1-border' : ''}`}
            >
              <div className="absolute left-0 top-1 w-4 h-4 bg-f1-red border border-f1-red" />

              <div
                className="ml-8 cursor-pointer"
                onClick={() => setExpandedId(expandedId === decision.id ? null : decision.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedId(expandedId === decision.id ? null : decision.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={expandedId === decision.id}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-f1-white uppercase tracking-widest">{decision.action}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-f1-muted uppercase tracking-widest">
                      <span>Lap {decision.lap}</span>
                      <span>•</span>
                      <span>{decision.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {decision.approved && <CheckCircle className="w-4 h-4 text-inter" />}
                    <div className={`px-2.5 py-1 text-[11px] font-bold border uppercase tracking-widest ${getConfidenceColor(decision.confidence)}`}>
                      {(decision.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <p className="text-sm text-f1-secondary mb-2">{decision.reasoning}</p>

                {decision.annotation && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-f1-dark border border-f1-border text-[11px] text-f1-red font-bold uppercase tracking-widest">
                    <MessageSquare className="w-3 h-3" />
                    {decision.annotation}
                  </div>
                )}

                <div className="text-xs text-f1-muted mt-2 uppercase tracking-widest">
                  {expandedId === decision.id ? '▼' : '▶'} Details
                </div>
              </div>

              {expandedId === decision.id && (
                <div className="ml-8 mt-4 space-y-4 p-4 border border-f1-border bg-f1-dark">
                  {decision.approved && (
                    <div className="flex items-center gap-2 text-xs text-inter uppercase tracking-widest">
                      <CheckCircle className="w-4 h-4" />
                      <span>Approved by {decision.approvedBy}</span>
                    </div>
                  )}

                  {decision.outcome && (
                    <div className="p-3 border border-f1-border bg-f1-black">
                      <h5 className="text-xs font-bold text-f1-white mb-2 uppercase tracking-widest">Outcome</h5>
                      <div className="space-y-1 text-xs text-f1-secondary">
                        <div className="flex justify-between">
                          <span className="text-f1-muted uppercase tracking-widest">Position</span>
                          <span className="font-mono">{decision.outcome.resultPosition}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-f1-muted uppercase tracking-widest">Gap to Leader</span>
                          <span className="font-mono">{decision.outcome.resultGap > 0 ? '+' : ''}{decision.outcome.resultGap.toFixed(1)}s</span>
                        </div>
                        <div className="mt-2 text-f1-muted">{decision.outcome.notes}</div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-f1-white mb-2 uppercase tracking-widest">Engineer Notes</label>
                    {decision.annotation ? (
                      <div className="p-3 bg-f1-black border border-f1-border text-xs text-f1-secondary">{decision.annotation}</div>
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
                          className="w-full h-20 px-3 py-2 bg-f1-black border border-f1-border text-xs text-f1-white placeholder:text-f1-muted focus:outline-none focus:border-f1-red resize-none"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddAnnotation(decision.id);
                          }}
                          className="px-3 py-1.5 bg-f1-red text-white text-xs font-bold uppercase tracking-widest hover:bg-f1-red-dark transition"
                        >
                          Save Note
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-3 border border-f1-border bg-f1-black">
                    <h5 className="text-xs font-bold text-f1-white mb-2 uppercase tracking-widest">Full Reasoning</h5>
                    <p className="text-xs text-f1-secondary">{decision.reasoning}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-f1-border grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-f1-muted mb-1 uppercase tracking-widest">Total Calls</div>
            <div className="text-2xl font-display font-black text-f1-white">{decisions.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-f1-muted mb-1 uppercase tracking-widest">Approved</div>
            <div className="text-2xl font-display font-black text-inter">{decisions.filter((d) => d.approved).length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-f1-muted mb-1 uppercase tracking-widest">Avg Confidence</div>
            <div className="text-2xl font-display font-black text-f1-red">
              {((decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
