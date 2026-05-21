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
  onAddAnnotation: _onAddAnnotation,
  onExportSession,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getConfidenceBadgeStyle = (confidence: number): React.CSSProperties => {
    const pct = confidence * 100;
    if (pct >= 70) return { backgroundColor: '#1A3C1A', color: '#39B54A', border: '1px solid #39B54A' };
    if (pct >= 40) return { backgroundColor: '#3C3000', color: '#FFC906', border: '1px solid #FFC906' };
    return { backgroundColor: '#3C0000', color: '#E10600', border: '1px solid #E10600' };
  };

  const avgConfidence = decisions.length > 0 
    ? (decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length) * 100 
    : 0;

  return (
    <Card className="border-[#38383F] bg-[#1F1F27] rounded-none shadow-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8 border-b border-f1-red pb-4">
          <div>
            <h3 className="text-[18px] font-display font-extrabold text-white flex items-center gap-2 uppercase tracking-tight">
              <FileText className="w-5 h-5 text-f1-red" />
              DECISION LOG
            </h3>
          </div>
          <button
            onClick={onExportSession}
            className="flex items-center gap-2 px-4 py-2 border border-[#38383F] bg-[#2D2D35] text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#38383F] transition-all"
          >
            <Download className="w-4 h-4" />
            EXPORT
          </button>
        </div>

        <div className="space-y-4">
          {decisions.map((decision) => (
            <div
              key={decision.id}
              className="p-4 bg-[#1F1F27] border-l-[4px] border-f1-red border border-[#38383F] transition-all hover:bg-[#2D2D35]"
            >
              <div
                className="cursor-pointer"
                onClick={() => setExpandedId(expandedId === decision.id ? null : decision.id)}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h4 className="text-[16px] font-display font-extrabold text-white uppercase tracking-tight">
                      {decision.action}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-[#FFC906] uppercase tracking-wider">
                        {decision.confidence * 100 < 40 ? 'RISKY CALL' : decision.confidence * 100 < 70 ? 'BORDERLINE CALL' : 'OPTIMAL CALL'}
                      </span>
                      <span className="text-[10px] text-[#67676D] font-mono">
                        LAP {decision.lap} • {decision.timestamp}
                      </span>
                    </div>
                  </div>

                  <div 
                    className="px-3 py-1 text-[12px] font-display font-bold uppercase"
                    style={getConfidenceBadgeStyle(decision.confidence)}
                  >
                    {(decision.confidence * 100).toFixed(0)}%
                  </div>
                </div>

                <p className="text-[13px] font-body text-[#C4C4C4] leading-relaxed mb-3">
                  {decision.reasoning}
                </p>

                <div className="flex items-center justify-between">
                  <button 
                    className="text-[11px] font-semibold text-f1-red uppercase tracking-wider hover:underline"
                  >
                    {expandedId === decision.id ? 'HIDE DETAILS' : 'VIEW DETAILS'}
                  </button>
                  {decision.annotation && (
                    <div className="flex items-center gap-1.5 text-[10px] text-[#67676D] font-bold uppercase">
                      <MessageSquare className="w-3 h-3" />
                      {decision.annotation.length > 20 ? decision.annotation.slice(0, 20) + '...' : decision.annotation}
                    </div>
                  )}
                </div>
              </div>

              {expandedId === decision.id && (
                <div className="mt-4 pt-4 border-t border-[#38383F] space-y-4">
                  {decision.approved && (
                    <div className="flex items-center gap-2 text-[11px] font-bold text-[#39B54A] uppercase tracking-wider">
                      <CheckCircle className="w-4 h-4" />
                      <span>Approved by {decision.approvedBy}</span>
                    </div>
                  )}
                  <div className="bg-[#15151E] p-3 border border-[#38383F]">
                    <h5 className="text-[10px] font-bold text-[#67676D] uppercase mb-2">Detailed Reasoning</h5>
                    <p className="text-[12px] text-[#C4C4C4] leading-relaxed">{decision.reasoning}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-[#38383F] grid grid-cols-3 divide-x divide-[#38383F]">
          <div className="text-center px-4">
            <div className="text-[28px] font-display font-extrabold text-white leading-none mb-1">{decisions.length}</div>
            <div className="text-[11px] font-semibold text-[#67676D] uppercase tracking-wider">Total Calls</div>
          </div>
          <div className="text-center px-4">
            <div className="text-[28px] font-display font-extrabold text-[#39B54A] leading-none mb-1">
              {decisions.filter((d) => d.approved).length}
            </div>
            <div className="text-[11px] font-semibold text-[#67676D] uppercase tracking-wider">Approved</div>
          </div>
          <div className="text-center px-4">
            <div className="text-[28px] font-display font-extrabold text-white leading-none mb-1">
              {avgConfidence.toFixed(0)}%
            </div>
            <div className="text-[11px] font-semibold text-[#67676D] uppercase tracking-wider">Avg Confidence</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
