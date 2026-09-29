import { CalendarDays, GitBranch, Grid3X3, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWorldCupData } from "../lib/data";
import { formatKickoff, readableStatus } from "../lib/format";
import type { BracketRound, BracketSlot, GroupStageExplorerGroup, MatchDetail, TeamSummary } from "../types/data";
import { TeamBadge } from "./TeamBadge";

type ExplorerMode = "groups" | "knockout";

export function MatchExplorer() {
  const data = useWorldCupData();
  const [mode, setMode] = useState<ExplorerMode>("groups");
  const explorer = data.matchExplorer;

  if (!explorer) {
    return (
      <section className="match-explorer" aria-label="Tournament path">
        <div className="match-explorer-top">
          <div>
            <span className="eyebrow">Tournament path</span>
            <h2>Explorer data is being regenerated.</h2>
            <p>Reload the page after the data build finishes to view the group board and knockout tree.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="match-explorer" aria-label="Tournament path">
      <div className="match-explorer-top">
        <div>
          <span className="eyebrow">Tournament path</span>
          <h2>{mode === "groups" ? "Group stage command board" : "Knockout tree"}</h2>
          <p>
            {mode === "groups"
              ? "Scan each group by leaders, standings pressure, and the six fixtures that decide the table."
              : "The bracket is built from knockout-stage matches when those rows appear in the CSV export."}
          </p>
        </div>
        <div className="segmented-control match-explorer-toggle" aria-label="Match explorer view">
          <button
            className={mode === "groups" ? "is-active" : ""}
            type="button"
            onClick={() => setMode("groups")}
          >
            <Grid3X3 size={15} />
            Group stage
          </button>
          <button
            className={mode === "knockout" ? "is-active" : ""}
            type="button"
            onClick={() => setMode("knockout")}
          >
            <GitBranch size={15} />
            KO stage
          </button>
        </div>
      </div>

      {mode === "groups" ? (
        <GroupStageExplorer groups={explorer.groupStage} matches={data.matches} teams={data.teams} />
      ) : (
        <KnockoutBracket rounds={explorer.knockoutBracket.rounds} matches={data.matches} note={explorer.knockoutBracket.note} />
      )}
    </section>
  );
}

function GroupStageExplorer({
  groups,
  matches,
  teams
}: {
  groups: GroupStageExplorerGroup[];
  matches: MatchDetail[];
  teams: TeamSummary[];
}) {
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.groupLetter ?? "A");
  const matchesById = useMemo(() => new Map(matches.map((match) => [match.id, match])), [matches]);
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const activeGroup = groups.find((group) => group.groupLetter === selectedGroup) ?? groups[0];
  const activeMatches = activeGroup.matchIds
    .map((matchId) => matchesById.get(matchId))
    .filter((match): match is MatchDetail => Boolean(match));

  return (
    <div className="group-explorer">
      <div className="group-selector-grid" aria-label="Groups">
        {groups.map((group) => {
          const leader = group.leaderTeamId ? teamsById.get(group.leaderTeamId) : undefined;
          const topPoints = group.standings[0]?.points ?? 0;

          return (
            <button
              className={`group-selector-card ${activeGroup.groupLetter === group.groupLetter ? "is-active" : ""}`}
              key={group.groupLetter}
              type="button"
              onClick={() => setSelectedGroup(group.groupLetter)}
            >
              <span>Group {group.groupLetter}</span>
              {leader ? <TeamBadge team={leader} size="sm" /> : <strong>TBD leader</strong>}
              <small>
                {group.completedCount}/{group.matchIds.length} played · {topPoints} pts lead
              </small>
            </button>
          );
        })}
      </div>

      <div className="group-explorer-layout">
        <article className="group-standings-mini">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Table</span>
              <h3>Group {activeGroup.groupLetter}</h3>
            </div>
            <span className="group-status-pill">
              {activeGroup.scheduledCount ? `${activeGroup.scheduledCount} scheduled` : "Complete"}
            </span>
          </div>
          <div className="mini-table" role="table" aria-label={`Group ${activeGroup.groupLetter} standings`}>
            <div className="mini-table-row is-head" role="row">
              <span>Team</span>
              <span>Pl</span>
              <span>GD</span>
              <span>Pts</span>
            </div>
            {activeGroup.standings.map((row) => {
              const team = teamsById.get(row.teamId);
              return (
                <Link className="mini-table-row" role="row" to={`/teams/${row.teamId}`} key={row.teamId}>
                  <span>{team ? <TeamBadge team={team} size="sm" /> : row.teamName}</span>
                  <span>{row.played}</span>
                  <span>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
                  <strong>{row.points}</strong>
                </Link>
              );
            })}
          </div>
        </article>

        <article className="group-fixtures-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Six-match path</span>
              <h3>Fixtures</h3>
            </div>
            <CalendarDays size={18} aria-hidden="true" />
          </div>
          <div className="group-match-list">
            {activeMatches.map((match) => (
              <GroupMatchStrip match={match} key={match.id} />
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function GroupMatchStrip({ match }: { match: MatchDetail }) {
  return (
    <Link className="group-match-strip" to={`/matches/${match.id}`}>
      <span className="group-match-date">{formatKickoff(match)}</span>
      <span className="group-match-teams">
        <TeamBadge team={match.homeTeam} size="sm" />
        <strong>{readableStatus(match)}</strong>
        <TeamBadge team={match.awayTeam} size="sm" />
      </span>
      <span className="group-match-venue">{match.venue?.city ?? "Venue TBD"}</span>
      <span className="match-strip-tooltip" role="tooltip">
        <strong>{match.stage?.name ?? "Match"}</strong>
        <span>{match.venue ? `${match.venue.stadiumName}, ${match.venue.city}` : "Venue pending"}</span>
        <small>
          {match.status === "Completed" ? `xG ${match.homeXg ?? "-"}-${match.awayXg ?? "-"}` : match.status}
        </small>
      </span>
    </Link>
  );
}

function KnockoutBracket({
  rounds,
  matches,
  note
}: {
  rounds: BracketRound[];
  matches: MatchDetail[];
  note: string;
}) {
  const matchesById = useMemo(() => new Map(matches.map((match) => [match.id, match])), [matches]);
  const mainRounds = rounds.filter((round) => !round.isThirdPlace);
  const thirdPlaceRound = rounds.find((round) => round.isThirdPlace);
  const hasRealKnockout = rounds.some((round) => round.slots.some((slot) => slot.matchId !== null));

  return (
    <div className="knockout-panel">
      {!hasRealKnockout ? (
        <div className="bracket-empty-note">
          <Trophy size={18} aria-hidden="true" />
          <span>{note} The tree below reserves the official round structure and will fill in automatically.</span>
        </div>
      ) : null}

      <div className="bracket-scroll" role="region" aria-label="Knockout bracket" tabIndex={0}>
        <div className="knockout-bracket">
          {mainRounds.map((round) => (
            <section className="bracket-round" key={round.stageId} aria-label={round.stageName}>
              <div className="bracket-round-title">
                <span>{round.stageName}</span>
                <small>{round.slots.length} matches</small>
              </div>
              <div className="bracket-slot-stack">
                {round.slots.map((slot) => (
                  <BracketMatchCard match={slot.matchId ? matchesById.get(slot.matchId) : undefined} slot={slot} key={slot.slotId} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {thirdPlaceRound ? (
        <section className="third-place-panel" aria-label="Third-place match">
          <div>
            <span className="eyebrow">Medal match</span>
            <h3>{thirdPlaceRound.stageName}</h3>
          </div>
          <div className="third-place-slot">
            {thirdPlaceRound.slots.map((slot) => (
              <BracketMatchCard match={slot.matchId ? matchesById.get(slot.matchId) : undefined} slot={slot} key={slot.slotId} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function BracketMatchCard({ match, slot }: { match?: MatchDetail; slot: BracketSlot }) {
  const body = match ? (
    <>
      <span className="bracket-slot-kicker">{formatKickoff(match)}</span>
      <span className="bracket-card-teams">
        <TeamBadge team={match.homeTeam} size="sm" />
        <strong>{readableStatus(match)}</strong>
        <TeamBadge team={match.awayTeam} size="sm" />
      </span>
      <span className="bracket-slot-meta">{match.venue ? `${match.venue.city} · ${match.venue.stadiumName}` : "Venue pending"}</span>
      <span className="bracket-card-tooltip" role="tooltip">
        <strong>{match.stage?.name ?? slot.stageName}</strong>
        <span>{match.venue ? `${match.venue.stadiumName}, ${match.venue.city}` : "Venue pending"}</span>
        <small>{match.status === "Completed" ? `Final score ${readableStatus(match)}` : match.status}</small>
      </span>
    </>
  ) : (
    <>
      <span className="bracket-slot-kicker">
        {slot.stageName} · Match {slot.position}
      </span>
      <span className="bracket-card-teams is-tbd">
        <span>TBD</span>
        <strong>vs</strong>
        <span>TBD</span>
      </span>
      <span className="bracket-slot-meta">Waiting for knockout rows in matches.csv</span>
      <span className="bracket-card-tooltip" role="tooltip">
        <strong>{slot.stageName}</strong>
        <span>Slot {slot.position}</span>
        <small>This card becomes a match link when the CSV contains this fixture.</small>
      </span>
    </>
  );

  if (match) {
    return (
      <Link className="bracket-slot-card" to={`/matches/${match.id}`}>
        {body}
      </Link>
    );
  }

  return (
    <article className="bracket-slot-card is-placeholder" tabIndex={0}>
      {body}
    </article>
  );
}
