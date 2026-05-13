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
      return <AlertCircle className="w-5 h-5 text-medium" />;
    case 'pit_stop':
      return <Wrench className="w-5 h-5 text-f1-white" />;
    case 'weather':
      return <Wind className="w-5 h-5 text-inter" />;
    case 'gap_spike':
    case 'flag':
    default:
      return <Clock className="w-5 h-5 text-f1-muted" />;
  }
};

const getEventColor = (type: RaceEvent['type'], severity?: string) => {
  if (severity === 'critical') return 'border-l-4 border-l-f1-red bg-f1-dark';
  if (severity === 'warning') return 'border-l-4 border-l-medium bg-f1-dark';
  
  switch (type) {
    case 'safety_car':
    case 'vsc':
      return 'border-l-4 border-l-f1-red bg-f1-dark';
    case 'incident':
      return 'border-l-4 border-l-medium bg-f1-dark';
    case 'pit_stop':
      return 'border-l-4 border-l-inter bg-f1-dark';
    case 'weather':
      return 'border-l-4 border-l-inter bg-f1-dark';
    default:
      return 'border-l-4 border-l-f1-border bg-f1-dark';
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
      <Card className="p-6 text-center text-f1-muted">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="font-bold uppercase tracking-widest">No race events recorded yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="f1-section-title text-xl mb-8">Race Timeline</h3>
      
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
                <div className="w-10 h-10 bg-f1-dark border border-f1-border flex items-center justify-center flex-shrink-0">
                {getEventIcon(event.type)}
              </div>
              {index < events.length - 1 && (
                  <div className="w-0.5 h-12 bg-f1-border mt-2" />
              )}
            </div>

            {/* Event content */}
            <div
              className={`flex-1 p-4 cursor-pointer transition-all ${getEventColor(
                event.type,
                event.severity
              )} ${
                selectedEvent === event.id
                  ? 'ring-1 ring-f1-red'
                  : 'hover:bg-f1-elevated'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-f1-white uppercase tracking-widest">{event.title}</h4>
                    {event.driver && (
                      <span className="text-xs font-bold px-2 py-1 bg-f1-border text-f1-white uppercase tracking-widest">
                        {event.driver}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-f1-secondary mb-2">{event.description}</p>
                  <div className="flex items-center gap-3 text-xs text-f1-muted uppercase tracking-widest">
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
      <div className="mt-6 pt-4 border-t border-f1-border grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-xs text-f1-muted mb-1 uppercase tracking-widest">Total Events</div>
          <div className="text-lg font-display font-black text-f1-white">{events.length}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-f1-muted mb-1 uppercase tracking-widest">Critical</div>
          <div className="text-lg font-display font-black text-f1-red">
            {events.filter((e) => e.severity === 'critical').length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-f1-muted mb-1 uppercase tracking-widest">Pit Stops</div>
          <div className="text-lg font-display font-black text-inter">
            {events.filter((e) => e.type === 'pit_stop').length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-f1-muted mb-1 uppercase tracking-widest">Incidents</div>
          <div className="text-lg font-display font-black text-medium">
            {events.filter((e) => e.type === 'incident').length}
          </div>
        </div>
      </div>
    </Card>
  );
};
