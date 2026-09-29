import type { TeamSummary } from "../types/data";
import { Flag } from "./Flag";

export function TeamBadge({
  team,
  size = "md",
  showCode = false
}: {
  team: Pick<TeamSummary, "teamName" | "fifaCode" | "flagCode" | "confederation">;
  size?: "sm" | "md" | "lg";
  showCode?: boolean;
}) {
  return (
    <span className={`team-badge team-badge-${size}`}>
      <span className="team-badge-mark" aria-hidden="true">
        <Flag code={team.flagCode} label={team.teamName} size={size} />
      </span>
      <span className="team-badge-copy">
        <strong>{team.teamName}</strong>
        {showCode ? <small>{team.fifaCode}</small> : null}
      </span>
    </span>
  );
}
