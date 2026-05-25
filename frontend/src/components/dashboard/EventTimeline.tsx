import React, { useState } from "react";

export interface RaceEvent {
  id: string;
  type: "safety_car" | "vsc" | "flag" | "incident" | "pit_stop" | "weather" | "gap_spike";
  lap: number;
  time: string; // HH:MM:SS
  driver?: string;
  title: string;
  description: string;
  severity?: "critical" | "warning" | "info";
}

interface EventTimelineProps {
  events?: RaceEvent[];
  onEventClick?: (event: RaceEvent) => void;
  fillHeight?: boolean;
}

// Mock race events for demo
const MOCK_EVENTS: RaceEvent[] = [
  {
    id: "1",
    type: "incident",
    lap: 5,
    time: "00:12:34",
    driver: "Verstappen",
    title: "Turn 3 Lock-up",
    description: "Max ran wide at Turn 3 losing 0.3s to Leclerc",
    severity: "warning",
  },
  {
    id: "2",
    type: "pit_stop",
    lap: 12,
    time: "00:28:45",
    driver: "Leclerc",
    title: "Ferrari P-Stop",
    description: "Leclerc pit stop: 2.1s (soft → hard)",
    severity: "info",
  },
  {
    id: "3",
    type: "gap_spike",
    lap: 15,
    time: "00:35:12",
    title: "Gap Volatility Spike",
    description: "Leader-P2 gap jumped +0.5s in 2 laps, tyre temp likely cause",
    severity: "warning",
  },
  {
    id: "4",
    type: "safety_car",
    lap: 18,
    time: "00:41:23",
    title: "Safety Car Deployed",
    description: "SC for debris at Turn 8, bunched field",
    severity: "critical",
  },
  {
    id: "5",
    type: "pit_stop",
    lap: 20,
    time: "00:46:18",
    driver: "Verstappen",
    title: "Red Bull P-Stop",
    description: "Verstappen pit stop: 1.9s (soft → hard)",
    severity: "info",
  },
  {
    id: "6",
    type: "weather",
    lap: 25,
    time: "00:55:34",
    title: "Track Temp Rise",
    description: "Track temperature increased to 32°C, soft tyres advantaged",
    severity: "info",
  },
];

const getDotColor = (type: RaceEvent["type"]): string => {
  switch (type) {
    case "pit_stop":
      return "#39FF14";
    case "safety_car":
    case "vsc":
      return "#ffd200";
    case "gap_spike":
    case "incident":
      return "#E8002D";
    default:
      return "#888890";
  }
};

const getTagClass = (type: RaceEvent["type"]): string => {
  switch (type) {
    case "pit_stop":
      return "pm-tl-event-tag pm-tag-pstop";
    case "safety_car":
    case "vsc":
      return "pm-tl-event-tag pm-tag-sc";
    case "gap_spike":
    case "incident":
      return "pm-tl-event-tag pm-tag-gap";
    default:
      return "pm-tl-event-tag pm-tag-track";
  }
};

const getTagLabel = (type: RaceEvent["type"]): string => {
  switch (type) {
    case "pit_stop":
      return "P-STOP";
    case "safety_car":
      return "SC";
    case "vsc":
      return "VSC";
    case "gap_spike":
      return "CRITICAL";
    case "incident":
      return "INCIDENT";
    case "weather":
      return "TRACK";
    default:
      return type.toUpperCase();
  }
};

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events = MOCK_EVENTS,
  onEventClick,
  fillHeight = false,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const handleEventClick = (event: RaceEvent) => {
    setSelectedEvent(event.id);
    onEventClick?.(event);
  };

  if (events.length === 0) {
    return (
      <div
        style={{
          padding: "32px",
          textAlign: "center",
          background: "var(--carbon-light)",
          border: "1px solid var(--border)",
        }}
      >
        <p
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
          }}
        >
          Awaiting Race Events
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--carbon)",
        overflow: "hidden",
        ...(fillHeight
          ? { height: "100%", minHeight: 0, display: "flex", flexDirection: "column" as const }
          : {}),
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          flexWrap: "wrap",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div className="pm-panel-title">Live Race Timeline</div>
        <div style={{ display: "flex", gap: 6 }}>
          <span
            className="pm-panel-badge"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 0,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "10px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            EVENTS {events.length}
          </span>
          <span
            className="pm-panel-badge pm-badge-ai"
            style={{
              borderRadius: 0,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "10px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            CRITICAL {events.filter((e) => e.severity === "critical").length}
          </span>
          <span
            className="pm-panel-badge pm-badge-live"
            style={{
              borderRadius: 0,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "10px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            PIT STOPS {events.filter((e) => e.type === "pit_stop").length}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div
        style={
          fillHeight
            ? { overflowY: "auto", flex: "1 1 0", minHeight: 0 }
            : { overflowY: "auto", maxHeight: 320 }
        }
      >
        {events.map((event, i) => {
          const dotColor = getDotColor(event.type);
          const isSelected = selectedEvent === event.id;

          return (
            <div
              key={event.id}
              className="pm-tl-item"
              onClick={() => handleEventClick(event)}
              style={isSelected ? { background: "rgba(232,0,45,0.04)" } : undefined}
            >
              {/* Lap + Time */}
              <div className="pm-tl-lap">
                LAP {event.lap}
                <span>{event.time}</span>
              </div>

              {/* Connector */}
              <div className="pm-tl-connector">
                <div
                  className="pm-tl-dot"
                  style={{
                    background: dotColor,
                    boxShadow: `0 0 6px ${dotColor}60`,
                  }}
                />
                {i < events.length - 1 && <div className="pm-tl-line" />}
              </div>

              {/* Content */}
              <div className="pm-tl-content">
                <div className="pm-tl-event">
                  {event.title}
                  <span
                    className={getTagClass(event.type)}
                    style={{
                      borderRadius: 0,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: "10px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                    }}
                  >
                    {getTagLabel(event.type)}
                  </span>
                  {event.driver && (
                    <span
                      className="pm-tl-event-tag"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: "var(--chrome)",
                        border: "1px solid var(--border)",
                        marginLeft: 4,
                        borderRadius: 0,
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: "10px",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                      }}
                    >
                      {event.driver.slice(0, 3).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="pm-tl-desc">{event.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
