import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { RotateCcw } from 'lucide-react';

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

  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/v1/metrics/health`);
      if (response.ok) {
        const data = await response.json();
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

  const getLatencyColor = (latency: number) => {
    if (latency < 200) return 'text-[#39B54A]';
    if (latency < 500) return 'text-[#FFC906]';
    return 'text-[#E10600]';
  };

  return (
    <Card className="border-f1-border bg-[#1F1F27] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-f1-red pb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#39B54A] animate-pulse-dot" />
          <h3 className="text-[24px] font-display font-extrabold text-white uppercase tracking-tight">
            {getStatusLabel(overallStatus)} - {healthyCount}/{metrics.length} SYSTEMS
          </h3>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 transition-all duration-200"
        >
          <RotateCcw className={`w-5 h-5 text-f1-red ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {metrics.filter(m => m).map((metric, idx) => (
          <div
            key={idx}
            className="p-3 border border-[#38383F] bg-[#2D2D35] relative overflow-hidden"
          >
            <h4 className="text-[10px] font-bold text-[#67676D] uppercase tracking-wider mb-1">{metric.name || 'System Metric'}</h4>
            <div className="text-[22px] font-display font-bold text-white leading-none mb-2">
              <span className={metric.name?.toLowerCase()?.includes('latency') ? getLatencyColor(Number(metric.value)) : ''}>
                {metric.value}
              </span>
              {metric.unit && <span className="text-[10px] text-[#67676D] ml-1 uppercase">{metric.unit}</span>}
            </div>
            
            {/* Threshold indicator */}
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#38383F]">
              {metric.threshold && (
                <div 
                  className={`h-full ${metric.status === 'healthy' ? 'bg-[#39B54A]' : metric.status === 'warning' ? 'bg-[#FFC906]' : 'bg-[#E10600]'}`}
                  style={{ width: `${Math.min(100, (Number(metric.value) / Number(metric.threshold)) * 100)}%` }}
                />
              )}
            </div>
            
            <div className="text-[9px] text-[#67676D] font-medium uppercase mt-1">
              {metric.lastUpdated?.replace(/seconds? ago/, 's ago').replace(/minutes? ago/, 'm ago').replace('Just now', '0s ago')}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Timeline */}
      <div className="space-y-6">
        <h4 className="text-[14px] font-display font-extrabold text-white uppercase tracking-wider border-b border-[#38383F] pb-2 mb-4">
          PERFORMANCE TIMELINE
        </h4>

        <div className="space-y-4">
          {/* API Latency */}
          <div className="group">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[11px] font-semibold text-[#67676D] uppercase min-w-[180px]">API Latency</span>
              <span className={`text-[12px] font-mono font-bold ${getLatencyColor(Number(health.latency?.value || 0))}`}>
                {health.latency?.value || 0}ms
              </span>
            </div>
            <div className="relative h-[4px] bg-[#2D2D35] w-full">
              <div
                className={`h-full transition-all duration-600 ease-out ${Number(health.latency?.value || 0) < 200 ? 'bg-[#39B54A]' : Number(health.latency?.value || 0) < 500 ? 'bg-[#FFC906]' : 'bg-[#E10600]'}`}
                style={{ width: `${Math.min(100, (Number(health.latency?.value || 0) / 500) * 100)}%` }}
              />
              <div className="absolute top-0 bottom-0 w-[1px] bg-white/30" style={{ left: '40%' }} title="Threshold: 200ms" />
            </div>
          </div>

          {/* Data Quality */}
          <div className="group">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[11px] font-semibold text-[#67676D] uppercase min-w-[180px]">Data Quality Score</span>
              <span className="text-[12px] font-mono font-bold text-white">{health.dataQuality?.value || 0}%</span>
            </div>
            <div className="relative h-[4px] bg-[#2D2D35] w-full">
              <div
                className="h-full bg-[#39B54A] transition-all duration-600 ease-out"
                style={{ width: `${health.dataQuality?.value || 0}%` }}
              />
              <div className="absolute top-0 bottom-0 w-[1px] bg-white/30" style={{ left: '90%' }} title="Threshold: 90%" />
            </div>
          </div>

          {/* Error Rate */}
          <div className="group">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[11px] font-semibold text-[#67676D] uppercase min-w-[180px]">Error Rate</span>
              <span className="text-[12px] font-mono font-bold text-white">{health.errorRate?.value || 0}%</span>
            </div>
            <div className="relative h-[4px] bg-[#2D2D35] w-full">
              <div
                className="h-full bg-[#39B54A] transition-all duration-600 ease-out"
                style={{ width: `${(Number(health.errorRate?.value || 0) / 2) * 100}%` }}
              />
              <div className="absolute top-0 bottom-0 w-[1px] bg-white/30" style={{ left: '50%' }} title="Threshold: 1.0%" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
