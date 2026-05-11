import React, { useState } from 'react';
import { AlertCircle, Flag, Wind, Clock, Wrench } from 'lucide-react';
import { Card } from '../ui/card';

export interface RaceEvent {
  id: string;
  type: 'safety_car' | 'vsc' | 'flag' | 'incident' | 'pit_stop' | 'weather' | 'gap_spike';
  lap: number;
  time: string; // HH:MM:SS
  driver?: string;
  title: string;
  description: string;
  severity?: 'critical' | 'warning' | 'info';
}

interface EventTimelineProps {
  events?: RaceEvent[];
  onEventClick?: (event: RaceEvent) => void;
}

// Mock race events for demo
const MOCK_EVENTS: RaceEvent[] = [
  {
    id: '1',
    type: 'incident',
    lap: 5,
    time: '00:12:34',
    driver: 'Verstappen',
    title: 'Turn 3 Lock-up',
    description: 'Max ran wide at Turn 3 losing 0.3s to Leclerc',
    severity: 'warning',
  },
  {
    id: '2',
    type: 'pit_stop',
    lap: 12,
    time: '00:28:45',
    driver: 'Leclerc',
    title: 'Ferrari P-Stop',
    description: 'Leclerc pit stop: 2.1s (soft → hard)',
    severity: 'info',
  },
  {
    id: '3',
    type: 'gap_spike',
    lap: 15,
    time: '00:35:12',
    title: 'Gap Volatility Spike',
    description: 'Leader-P2 gap jumped +0.5s in 2 laps, tyre temp likely cause',
    severity: 'warning',
  },
  {
    id: '4',
    type: 'safety_car',
    lap: 18,
    time: '00:41:23',
    title: 'Safety Car Deployed',
    description: 'SC for debris at Turn 8, bunched field',
    severity: 'critical',
  },
  {
    id: '5',
    type: 'pit_stop',
    lap: 20,
    time: '00:46:18',
    driver: 'Verstappen',
    title: 'Red Bull P-Stop',
    description: 'Verstappen pit stop: 1.9s (soft → hard)',
    severity: 'info',
  },
  {
    id: '6',
    type: 'weather',
    lap: 25,
    time: '00:55:34',
    title: 'Track Temp Rise',
    description: 'Track temperature increased to 32°C, soft tyres advantaged',
    severity: 'info',
  },
];

const getEventIcon = (type: RaceEvent['type']) => {
  switch (type) {
    case 'safety_car':
    case 'vsc':
      return <Flag className="w-5 h-5 text-f1-red" />;
    case 'incident':
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
    case 'pit_stop':
      return <Wrench className="w-5 h-5 text-blue-500" />;
    case 'weather':
      return <Wind className="w-5 h-5 text-cyan-500" />;
    case 'gap_spike':
    case 'flag':
    default:
      return <Clock className="w-5 h-5 text-pit-muted" />;
  }
};

const getEventColor = (type: RaceEvent['type'], severity?: string) => {
  if (severity === 'critical') return 'border-l-4 border-l-f1-red bg-f1-red/15';
  if (severity === 'warning') return 'border-l-4 border-l-amber-500 bg-amber-500/15';
  
  switch (type) {
    case 'safety_car':
    case 'vsc':
      return 'border-l-4 border-l-f1-red bg-f1-red/15';
    case 'incident':
      return 'border-l-4 border-l-amber-500 bg-amber-500/15';
    case 'pit_stop':
      return 'border-l-4 border-l-blue-500 bg-blue-500/15';
    case 'weather':
      return 'border-l-4 border-l-cyan-500 bg-cyan-500/15';
    default:
      return 'border-l-4 border-l-pit-stroke bg-pit-panel/60';
  }
};

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events = MOCK_EVENTS,
  onEventClick,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const handleEventClick = (event: RaceEvent) => {
    setSelectedEvent(event.id);
    onEventClick?.(event);
  };

  if (events.length === 0) {
    return (
      <Card className="p-6 text-center text-pit-muted">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="font-semibold">No race events recorded yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-black text-pit-fg mb-8 uppercase tracking-wide">Race Timeline</h3>
      
      {/* Timeline container */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {events.map((event, index) => (
          <div
            key={event.id}
            className="flex gap-4 items-start"
            onClick={() => handleEventClick(event)}
          >
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center flex-shrink-0">
                {getEventIcon(event.type)}
              </div>
              {index < events.length - 1 && (
                <div className="w-0.5 h-12 bg-slate-200 mt-2" />
              )}
            </div>

            {/* Event content */}
            <div
              className={`flex-1 p-4 rounded-lg cursor-pointer transition-all ${getEventColor(
                event.type,
                event.severity
              )} ${
                selectedEvent === event.id
                  ? 'ring-2 ring-offset-2 ring-blue-400 shadow-md'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900">{event.title}</h4>
                    {event.driver && (
                      <span className="text-xs font-medium px-2 py-1 bg-slate-200 rounded text-slate-700">
                        {event.driver}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{event.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span>Lap {event.lap}</span>
                    <span>•</span>
                    <span>{event.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-xs text-slate-600 mb-1">Total Events</div>
          <div className="text-lg font-bold text-slate-900">{events.length}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-600 mb-1">Critical</div>
          <div className="text-lg font-bold text-red-600">
            {events.filter((e) => e.severity === 'critical').length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-600 mb-1">Pit Stops</div>
          <div className="text-lg font-bold text-blue-600">
            {events.filter((e) => e.type === 'pit_stop').length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-600 mb-1">Incidents</div>
          <div className="text-lg font-bold text-amber-600">
            {events.filter((e) => e.type === 'incident').length}
          </div>
        </div>
      </div>
    </Card>
  );
};
