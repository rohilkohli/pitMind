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
      return 'border-emerald-500/40 bg-emerald-500/15';
    case 'warning':
      return 'border-amber-500/40 bg-amber-500/15';
    case 'critical':
      return 'border-f1-red/40 bg-f1-red/15';
    default:
      return 'border-pit-stroke bg-pit-panel/60';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-amber-400" />;
    case 'critical':
      return <AlertCircle className="w-5 h-5 text-f1-red" />;
    default:
      return null;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'HEALTHY';
    case 'warning':
      return 'WARNING';
    case 'critical':
      return 'CRITICAL';
    default:
      return 'UNKNOWN';
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
    <Card className="border-pit-stroke bg-pit-panel/90 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Activity className="w-6 h-6 text-f1-red" />
          <div>
            <h3 className="text-2xl font-black text-pit-fg uppercase tracking-wide">System Health</h3>
            <p className="text-xs text-pit-muted mt-2 font-semibold">Real-time observability and diagnostics</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-3 rounded-lg border border-pit-stroke bg-pit-panel hover:border-f1-red/40 hover:shadow-glow transition-all duration-200 ${
            isRefreshing ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <RotateCcw className={`w-5 h-5 text-f1-red ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Overall status */}
      <div className={`mb-8 p-5 rounded-2xl border-2 transition-all duration-200 ${getStatusColor(overallStatus)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(overallStatus)}
            <span className="font-black text-pit-fg text-lg uppercase tracking-wide">
              {getStatusLabel(overallStatus)} · {healthyCount}/{metrics.length} Systems
            </span>
          </div>
          <div className="text-sm font-mono text-pit-muted font-bold">Last: {MOCK_HEALTH.api.lastUpdated}</div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            onClick={() => toggleExpanded(metric.name)}
            className={`cursor-pointer p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-glow-lg ${getStatusColor(metric.status)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-xs font-black text-pit-muted uppercase tracking-widest">{metric.name}</h4>
              {getStatusIcon(metric.status)}
            </div>

            <div className="mb-3">
              <div className="text-3xl font-black text-f1-red">
                {metric.value}
                {metric.unit && <span className="text-xs text-pit-muted ml-2">{metric.unit}</span>}
              </div>
            </div>

            {metric.threshold && (
              <div className="text-xs text-pit-muted font-semibold">
                Threshold: {metric.threshold}
                {metric.unit}
              </div>
            )}

            {metric.lastUpdated && (
              <div className="text-xs text-pit-muted mt-3 font-semibold">{metric.lastUpdated}</div>
            )}
          </div>
        ))}
      </div>

      {/* Performance indicators */}
      <div className="p-5 rounded-xl border border-pit-stroke bg-pit-panel/60">
        <h4 className="text-base font-black text-pit-fg mb-5 flex items-center gap-3 uppercase tracking-wide">
          <Gauge className="w-5 h-5 text-f1-red" />
          Performance Timeline
        </h4>

        <div className="space-y-5">
          {/* API Latency Chart */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-pit-muted uppercase tracking-wider">API Latency (ms)</span>
              <span className="text-sm font-mono text-f1-red font-black">142ms</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-f1-red to-orange-500 rounded-full transition-all duration-500"
                style={{ width: '28%' }}
              />
            </div>
            <div className="text-xs text-pit-muted mt-2 font-semibold">500ms threshold</div>
          </div>

          {/* Data Quality */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-pit-muted uppercase tracking-wider">Data Quality Score</span>
              <span className="text-sm font-mono text-f1-red font-black">96.8%</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: '96.8%' }}
              />
            </div>
            <div className="text-xs text-pit-muted mt-2 font-semibold">90% threshold</div>
          </div>

          {/* Error Rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-pit-muted uppercase tracking-wider">Error Rate</span>
              <span className="text-sm font-mono text-f1-red font-black">0.3%</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: '15%' }} />
            </div>
            <div className="text-xs text-pit-muted mt-2 font-semibold">2% threshold</div>
          </div>
        </div>
      </div>

      {/* System info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 rounded-lg bg-pit-panel/60 border border-pit-stroke transition-all duration-200 hover:border-f1-red/30">
          <div className="text-xs text-pit-muted mb-2 font-bold uppercase tracking-widest">Strategy Engine</div>
          <div className="text-lg font-black text-f1-red">Granite v1.2</div>
          <div className="text-xs text-pit-muted mt-2 font-semibold">IBM Watsonx</div>
        </div>

        <div className="p-4 rounded-lg bg-pit-panel/60 border border-pit-stroke transition-all duration-200 hover:border-f1-red/30">
          <div className="text-xs text-pit-muted mb-2 font-bold uppercase tracking-widest">Session</div>
          <div className="text-lg font-black text-f1-red">Monza 2026</div>
          <div className="text-xs text-pit-muted mt-2 font-semibold">Lap 27 / 51</div>
        </div>

        <div className="p-4 rounded-lg bg-pit-panel/60 border border-pit-stroke transition-all duration-200 hover:border-f1-red/30">
          <div className="text-xs text-pit-muted mb-2 font-bold uppercase tracking-widest">Feed Status</div>
          <div className="text-lg font-black text-emerald-400">Live</div>
          <div className="text-xs text-emerald-400 mt-2 font-semibold">Connected</div>
        </div>
      </div>
    </Card>
  );
};
