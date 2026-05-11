import React, { useState } from 'react';
import { Card } from '../ui/card';
import {
  Activity,
  Gauge,
  AlertCircle,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';

export interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string | number;
  unit?: string;
  threshold?: number;
  lastUpdated?: string;
}

export interface HealthSnapshot {
  api: HealthMetric;
  latency: HealthMetric;
  dataQuality: HealthMetric;
  engineerApprovals: HealthMetric;
  uptime: HealthMetric;
  strategyCallCount: HealthMetric;
  errorRate: HealthMetric;
  tlemetryDatapoints: HealthMetric;
}

interface HealthConsoleProps {
  onRefresh?: () => void;
}

// Mock health snapshot
const MOCK_HEALTH: HealthSnapshot = {
  api: {
    name: 'API Gateway',
    status: 'healthy',
    value: 'Online',
    lastUpdated: '2 seconds ago',
  },
  latency: {
    name: 'Response Latency',
    status: 'healthy',
    value: 142,
    unit: 'ms',
    threshold: 500,
    lastUpdated: '1 second ago',
  },
  dataQuality: {
    name: 'Data Quality Score',
    status: 'healthy',
    value: 96.8,
    unit: '%',
    threshold: 90,
    lastUpdated: '5 seconds ago',
  },
  engineerApprovals: {
    name: 'Engineer Approvals',
    status: 'healthy',
    value: 4,
    unit: 'decisions',
    lastUpdated: '3 minutes ago',
  },
  uptime: {
    name: 'System Uptime',
    status: 'healthy',
    value: '4h 23m',
    lastUpdated: '1 second ago',
  },
  strategyCallCount: {
    name: 'Strategy Calls',
    status: 'healthy',
    value: 12,
    unit: 'total',
    lastUpdated: '2 minutes ago',
  },
  errorRate: {
    name: 'Error Rate',
    status: 'healthy',
    value: 0.3,
    unit: '%',
    threshold: 2.0,
    lastUpdated: '1 second ago',
  },
  tlemetryDatapoints: {
    name: 'Telemetry Points',
    status: 'healthy',
    value: 2847,
    unit: 'pts',
    lastUpdated: '1 second ago',
  },
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'border-emerald-500/30 bg-emerald-500/10';
    case 'warning':
      return 'border-amber-500/30 bg-amber-500/10';
    case 'critical':
      return 'border-red-500/30 bg-red-500/10';
    default:
      return 'border-white/10 bg-black/20';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-amber-400" />;
    case 'critical':
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    default:
      return null;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'warning':
      return 'Warning';
    case 'critical':
      return 'Critical';
    default:
      return 'Unknown';
  }
};

export const HealthConsole: React.FC<HealthConsoleProps> = ({ onRefresh }) => {
  const [health] = useState<HealthSnapshot>(MOCK_HEALTH);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsRefreshing(false);
    onRefresh?.();
  };

  const toggleExpanded = (name: string) => {
    const newExpanded = new Set(expandedMetrics);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedMetrics(newExpanded);
  };

  const metrics = [
    health.api,
    health.latency,
    health.dataQuality,
    health.engineerApprovals,
    health.uptime,
    health.strategyCallCount,
    health.errorRate,
    health.tlemetryDatapoints,
  ];

  const healthyCount = metrics.filter((m) => m.status === 'healthy').length;
  const overallStatus = metrics.some((m) => m.status === 'critical')
    ? 'critical'
    : metrics.some((m) => m.status === 'warning')
    ? 'warning'
    : 'healthy';

  return (
    <Card className="border-white/10 bg-white/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-pit-accent" />
          <div>
            <h3 className="text-lg font-semibold text-pit-fg">System Health</h3>
            <p className="text-xs text-pit-muted mt-1">Real-time observability and diagnostics</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-2 rounded-lg border border-white/10 bg-black/20 text-pit-fg hover:border-white/20 hover:bg-black/30 transition ${
            isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Overall status */}
      <div className={`mb-6 p-4 rounded-2xl border-2 ${getStatusColor(overallStatus)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            <span className="font-semibold text-pit-fg">
              {getStatusLabel(overallStatus)} · {healthyCount}/{metrics.length} Systems
            </span>
          </div>
          <div className="text-sm font-mono text-pit-muted">Last updated: {MOCK_HEALTH.api.lastUpdated}</div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            onClick={() => toggleExpanded(metric.name)}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${getStatusColor(metric.status)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-xs font-semibold text-pit-muted uppercase tracking-wider">{metric.name}</h4>
              {getStatusIcon(metric.status)}
            </div>

            <div className="mb-2">
              <div className="text-2xl font-bold text-pit-fg">
                {metric.value}
                {metric.unit && <span className="text-sm text-pit-muted ml-1">{metric.unit}</span>}
              </div>
            </div>

            {metric.threshold && (
              <div className="text-[10px] text-pit-muted">
                Threshold: {metric.threshold}
                {metric.unit}
              </div>
            )}

            {metric.lastUpdated && (
              <div className="text-[10px] text-pit-muted mt-2">{metric.lastUpdated}</div>
            )}
          </div>
        ))}
      </div>

      {/* Performance indicators */}
      <div className="p-4 rounded-xl border border-white/10 bg-black/20 mb-6">
        <h4 className="text-sm font-semibold text-pit-fg mb-3 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-pit-accent" />
          Performance Timeline
        </h4>

        <div className="space-y-3">
          {/* API Latency Chart */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-pit-muted">API Latency (ms)</span>
              <span className="text-xs font-mono text-pit-fg">142ms</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: '28%' }}
              />
            </div>
            <div className="text-[10px] text-pit-muted mt-1">500ms threshold</div>
          </div>

          {/* Data Quality */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-pit-muted">Data Quality Score</span>
              <span className="text-xs font-mono text-pit-fg">96.8%</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: '96.8%' }}
              />
            </div>
            <div className="text-[10px] text-pit-muted mt-1">90% threshold</div>
          </div>

          {/* Error Rate */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-pit-muted">Error Rate</span>
              <span className="text-xs font-mono text-pit-fg">0.3%</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '15%' }} />
            </div>
            <div className="text-[10px] text-pit-muted mt-1">2% threshold</div>
          </div>
        </div>
      </div>

      {/* System info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-black/20 border border-white/10">
          <div className="text-[10px] text-pit-muted mb-1 uppercase tracking-wider">Strategy Engine</div>
          <div className="text-sm font-bold text-pit-fg">Granite v1.2</div>
          <div className="text-[10px] text-pit-muted mt-1">IBM Watsonx</div>
        </div>

        <div className="p-3 rounded-lg bg-black/20 border border-white/10">
          <div className="text-[10px] text-pit-muted mb-1 uppercase tracking-wider">Session</div>
          <div className="text-sm font-bold text-pit-fg">Monza 2026</div>
          <div className="text-[10px] text-pit-muted mt-1">Lap 27 / 51</div>
        </div>

        <div className="p-3 rounded-lg bg-black/20 border border-white/10">
          <div className="text-[10px] text-pit-muted mb-1 uppercase tracking-wider">Feed Status</div>
          <div className="text-sm font-bold text-pit-fg">Live</div>
          <div className="text-[10px] text-emerald-400 mt-1">Connected</div>
        </div>
      </div>
    </Card>
  );
};
