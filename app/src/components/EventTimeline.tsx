import { CircleAlert, Flag, Goal, RectangleHorizontal, SearchCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { MatchEvent } from "../types/data";
import { percent } from "../lib/format";

function eventIcon(eventType: string) {
  if (eventType === "Goal") return Goal;
  if (eventType === "Assist") return Flag;
  if (eventType.includes("Card")) return RectangleHorizontal;
  if (eventType === "VAR Review") return SearchCheck;
  return CircleAlert;
}

function eventTone(eventType: string) {
  if (eventType === "Goal") return "goal";
  if (eventType === "Assist") return "assist";
  if (eventType === "Yellow Card") return "yellow-card";
  if (eventType === "Red Card") return "red-card";
  if (eventType === "VAR Review") return "var-review";
  return "default";
}

function timelinePosition(minute: number, maxMinute: number) {
  return 8 + percent(minute, maxMinute) * 0.89;
}

export function EventTimeline({
  events,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName
}: {
  events: MatchEvent[];
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
}) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const maxMinute = Math.max(90, ...events.map((event) => event.minute));
  const positionedEvents = useMemo(() => {
    const seen = new Map<string, number>();
    return events.map((event) => {
      const lane = event.teamId === homeTeamId ? "home" : event.teamId === awayTeamId ? "away" : "neutral";
      const key = `${lane}-${event.minute}`;
      const offset = seen.get(key) ?? 0;
      seen.set(key, offset + 1);
      return {
        ...event,
        lane,
        offset,
        left: timelinePosition(event.minute, maxMinute),
        top: lane === "home" ? 34 + offset * 11 : lane === "away" ? 66 + offset * 11 : 50 + offset * 11
      };
    });
  }, [awayTeamId, events, homeTeamId, maxMinute]);

  if (!events.length) {
    return <p className="empty-copy">No event timeline has been published for this match yet.</p>;
  }

  const markers = [0, 15, 30, 45, 60, 75, 90];
  if (maxMinute > 90) markers.push(maxMinute);
  const hoveredEvent = positionedEvents.find((event) => event.id === hoveredId);

  return (
    <div className="event-timeline" role="list" aria-label="Match event timeline">
      <div className="timeline-team-label timeline-team-home">{homeTeamName}</div>
      <div className="timeline-team-label timeline-team-away">{awayTeamName}</div>
      <div className="timeline-axis timeline-axis-home" aria-hidden="true" />
      <div className="timeline-axis timeline-axis-away" aria-hidden="true" />
      {markers.map((minute) => (
        <span
          className="timeline-marker"
          key={minute}
          style={{ left: `${timelinePosition(minute, maxMinute)}%` }}
          aria-hidden="true"
        >
          {minute === maxMinute && minute > 90 ? `${minute}'` : minute}
        </span>
      ))}
      {positionedEvents.map((event) => {
        const Icon = eventIcon(event.eventType);
        return (
          <button
            className={`timeline-event event-tone-${eventTone(event.eventType)}`}
            key={event.id}
            type="button"
            style={{ left: `${event.left}%`, top: `${event.top}%` }}
            onMouseEnter={() => setHoveredId(event.id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(event.id)}
            onBlur={() => setHoveredId(null)}
            aria-label={`${event.minute} minute ${event.eventType}, ${event.playerName}, ${event.teamName}`}
          >
            <span>{event.minute}'</span>
            <span className="event-icon">
              <Icon size={16} />
            </span>
          </button>
        );
      })}
      {hoveredEvent ? (
        <div
          className="timeline-tooltip"
          style={{ left: `${hoveredEvent.left}%`, top: `${hoveredEvent.top}%` }}
        >
          <strong>
            {hoveredEvent.minute}' · {hoveredEvent.eventType}
          </strong>
          <span>{hoveredEvent.playerName}</span>
          <small>{hoveredEvent.teamName}</small>
        </div>
      ) : null}
    </div>
  );
}
