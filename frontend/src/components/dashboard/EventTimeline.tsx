import React, { useState } from 'react';
import { Clock } from 'lucide-react';

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

const getDriverColor = (driver?: string) => {
  if (!driver) return '#67676D';
  const d = driver.toUpperCase();
  if (d.includes('VER')) return '#3671C6';
  if (d.includes('LEC')) return '#E8002D';
  if (d.includes('HAM')) return '#27F4D2';
  if (d.includes('NOR')) return '#FF8000';
  return '#E10600';
};

const getEventBorderColor = (type: RaceEvent['type']) => {
  switch (type) {
    case 'incident':
    case 'safety_car':
    case 'vsc':
      return '#E10600'; // red
    case 'flag':
      return '#FFC906'; // yellow
    case 'pit_stop':
      return '#3671C6'; // blue
    default:
      return '#38383F';
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
      <div className="p-8 text-center bg-[#1F1F27] border border-[#38383F]">
        <Clock className="w-12 h-12 mx-auto mb-4 text-[#67676D] opacity-20" />
        <p className="text-[14px] font-display font-bold text-[#67676D] uppercase tracking-widest">Awaiting Race Events</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#15151E]">
      <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => handleEventClick(event)}
            className={`flex flex-col p-3 cursor-pointer transition-all bg-[#1F1F27] border-l-[4px] border-[#38383F] ${
              selectedEvent === event.id ? 'ring-1 ring-f1-red' : 'hover:bg-[#2D2D35]'
            }`}
            style={{ borderLeftColor: getEventBorderColor(event.type) }}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-[15px] font-display font-bold text-white uppercase tracking-tight">{event.title}</h4>
                {event.driver && (
                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 text-white uppercase tracking-wider"
                    style={{ backgroundColor: getDriverColor(event.driver) }}
                  >
                    {event.driver}
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-[#67676D] uppercase text-right leading-none">
                <div>LAP {event.lap}</div>
                <div className="mt-1">{event.time}</div>
              </div>
            </div>
            <p className="text-[12px] font-normal text-[#C4C4C4] leading-relaxed font-body">
              {event.description}
            </p>
          </div>
        ))}
      </div>

      {/* Footer Stat Pills */}
      <div className="p-4 bg-[#15151E] border-t border-[#38383F] flex flex-wrap gap-2">
        <div className="px-3 py-2 bg-[#2D2D35] flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#67676D] uppercase">Events</span>
          <span className="text-[13px] font-display font-bold text-white">{events.length}</span>
        </div>
        <div className="px-3 py-2 bg-[#2D2D35] flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#67676D] uppercase">Critical</span>
          <span className="text-[13px] font-display font-bold text-[#E10600]">
            {events.filter((e) => e.severity === 'critical').length}
          </span>
        </div>
        <div className="px-3 py-2 bg-[#2D2D35] flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#67676D] uppercase">Pit Stops</span>
          <span className="text-[13px] font-display font-bold text-[#3671C6]">
            {events.filter((e) => e.type === 'pit_stop').length}
          </span>
        </div>
        <div className="px-3 py-2 bg-[#2D2D35] flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#67676D] uppercase">Incidents</span>
          <span className="text-[13px] font-display font-bold text-[#FFC906]">
            {events.filter((e) => e.type === 'incident').length}
          </span>
        </div>
      </div>
    </div>
  );
};
