import type { MatchDetail, PositionCode, TeamSummary } from "../types/data";

const euroFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("en-US");

export const positionOrder: PositionCode[] = ["GK", "DEF", "MID", "FWD"];

export function formatCurrency(value: number): string {
  return euroFormatter.format(value);
}

export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  return euroFormatter.format(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}

export function formatKickoff(match: Pick<MatchDetail, "date" | "kickoffTimeUtc">): string {
  return `${formatDate(match.date)} · ${match.kickoffTimeUtc} UTC`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function percent(value: number, max: number): number {
  if (max <= 0) return 0;
  return clamp((value / max) * 100, 0, 100);
}

export function teamColor(team: Pick<TeamSummary, "teamName" | "confederation"> | string): string {
  const label = typeof team === "string" ? team : `${team.teamName}-${team.confederation}`;
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) hash = label.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 72% 48%)`;
}

export function teamInitials(teamName: string): string {
  return teamName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function resultClass(result: "W" | "D" | "L"): string {
  if (result === "W") return "is-win";
  if (result === "D") return "is-draw";
  return "is-loss";
}

export function readableStatus(match: MatchDetail): string {
  if (match.status === "Completed") return `${match.homeScore}-${match.awayScore}`;
  return match.status;
}
