import React, { useState, useEffect } from 'react';
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
  telemetryDatapoints: HealthMetric;
  ai: HealthMetric;
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
  telemetryDatapoints: {
    name: 'Telemetry Points',
    status: 'healthy',
    value: 2847,
    unit: 'pts',
    lastUpdated: '1 second ago',
  },
  ai: {
    name: 'AI Engine',
    status: 'healthy',
    value: 'Optimal',
    lastUpdated: 'Just now',
  },
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'border-inter/40 bg-f1-dark';
    case 'warning':
      return 'border-medium/40 bg-f1-dark';
    case 'critical':
      return 'border-f1-red/40 bg-f1-dark';
    default:
      return 'border-f1-border bg-f1-dark';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="w-5 h-5 text-inter" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-medium" />;
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
  const [health, setHealth] = useState<HealthSnapshot>(MOCK_HEALTH);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());

  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/v1/metrics/health`);
      if (response.ok) {
        const data = await response.json();
        // Map backend response to frontend snapshot
        // Backend keys match frontend keys now
        setHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch health metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchHealth();
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
    health.telemetryDatapoints,
    health.ai,
  ];

  const healthyCount = metrics.filter((m) => m.status === 'healthy').length;
  const overallStatus = metrics.some((m) => m.status === 'critical')
    ? 'critical'
    : metrics.some((m) => m.status === 'warning')
    ? 'warning'
    : 'healthy';

  return (
    <Card className="border-f1-border bg-f1-black p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Activity className="w-6 h-6 text-f1-red" />
          <div>
            <h3 className="text-2xl font-display font-black text-f1-white uppercase tracking-widest">System Health</h3>
            <p className="text-xs text-f1-muted mt-2 font-bold uppercase tracking-widest">Real-time observability and diagnostics</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-3 border border-f1-border bg-f1-dark hover:border-f1-red/40 transition-all duration-200 ${
            isRefreshing ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <RotateCcw className={`w-5 h-5 text-f1-red ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Overall status */}
      <div className={`mb-8 p-5 border-2 transition-all duration-200 ${getStatusColor(overallStatus)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(overallStatus)}
            <span className="font-display font-black text-f1-white text-lg uppercase tracking-widest">
              {getStatusLabel(overallStatus)} · {healthyCount}/{metrics.length} Systems
            </span>
          </div>
          <div className="text-sm font-mono text-f1-muted font-bold">Last: {MOCK_HEALTH.api.lastUpdated}</div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            onClick={() => toggleExpanded(metric.name)}
            className={`cursor-pointer p-5 border-2 transition-all duration-200 ${getStatusColor(metric.status)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-xs font-black text-f1-muted uppercase tracking-widest">{metric.name}</h4>
              {getStatusIcon(metric.status)}
            </div>

            <div className="mb-3">
              <div className="text-3xl font-black text-f1-red">
                {metric.value}
                {metric.unit && <span className="text-xs text-f1-muted ml-2">{metric.unit}</span>}
              </div>
            </div>

            {metric.threshold && (
              <div className="text-xs text-f1-muted font-semibold">
                Threshold: {metric.threshold}
                {metric.unit}
              </div>
            )}

            {metric.lastUpdated && (
              <div className="text-xs text-f1-muted mt-3 font-semibold">{metric.lastUpdated}</div>
            )}
          </div>
        ))}
      </div>

      {/* Performance indicators */}
      <div className="p-5 border border-f1-border bg-f1-dark">
        <h4 className="text-base font-black text-f1-white mb-5 flex items-center gap-3 uppercase tracking-widest">
          <Gauge className="w-5 h-5 text-f1-red" />
          Performance Timeline
        </h4>

        <div className="space-y-5">
          {/* API Latency Chart */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-f1-muted uppercase tracking-widest">API Latency (ms)</span>
              <span className="text-sm font-mono text-f1-red font-black">142ms</span>
            </div>
            <div className="h-2 bg-f1-border overflow-hidden">
              <div
                className="h-full bg-f1-red transition-all duration-500"
                style={{ width: '28%' }}
              />
            </div>
            <div className="text-xs text-f1-muted mt-2 font-semibold">500ms threshold</div>
          </div>

          {/* Data Quality */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-f1-muted uppercase tracking-widest">Data Quality Score</span>
              <span className="text-sm font-mono text-f1-red font-black">96.8%</span>
            </div>
            <div className="h-2 bg-f1-border overflow-hidden">
              <div
                className="h-full bg-inter transition-all duration-500"
                style={{ width: '96.8%' }}
              />
            </div>
            <div className="text-xs text-f1-muted mt-2 font-semibold">90% threshold</div>
          </div>

          {/* Error Rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-f1-muted uppercase tracking-widest">Error Rate</span>
              <span className="text-sm font-mono text-f1-red font-black">0.3%</span>
            </div>
            <div className="h-2 bg-f1-border overflow-hidden">
              <div className="h-full bg-inter transition-all duration-500" style={{ width: '15%' }} />
            </div>
            <div className="text-xs text-f1-muted mt-2 font-semibold">2% threshold</div>
          </div>
        </div>
      </div>

      {/* System info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 border border-f1-border bg-f1-dark transition-all duration-200 hover:border-f1-red/30">
          <div className="text-xs text-f1-muted mb-2 font-bold uppercase tracking-widest">Strategy Engine</div>
          <div className="text-lg font-black text-f1-red">Granite v1.2</div>
          <div className="text-xs text-f1-muted mt-2 font-semibold">IBM Watsonx</div>
        </div>

        <div className="p-4 border border-f1-border bg-f1-dark transition-all duration-200 hover:border-f1-red/30">
          <div className="text-xs text-f1-muted mb-2 font-bold uppercase tracking-widest">Session</div>
          <div className="text-lg font-black text-f1-red">Monza 2026</div>
          <div className="text-xs text-f1-muted mt-2 font-semibold">Lap 27 / 51</div>
        </div>

        <div className="p-4 border border-f1-border bg-f1-dark transition-all duration-200 hover:border-f1-red/30">
          <div className="text-xs text-f1-muted mb-2 font-bold uppercase tracking-widest">Feed Status</div>
          <div className="text-lg font-black text-inter">Live</div>
          <div className="text-xs text-inter mt-2 font-semibold">Connected</div>
        </div>
      </div>
    </Card>
  );
};
