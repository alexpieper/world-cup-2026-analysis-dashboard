import { ArrowLeft, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BarList } from "../components/Charts";
import { SquadPitch } from "../components/Pitch";
import { StatCard } from "../components/StatCard";
import { TeamBadge } from "../components/TeamBadge";
import { useWorldCupData } from "../lib/data";
import { formatCompactCurrency, formatCurrency, resultClass } from "../lib/format";
import type { PlayerProfile } from "../types/data";

type SortKey = "marketValueEur" | "caps" | "internationalGoals" | "age";

export function TeamDetailPage() {
  const { teamId } = useParams();
  const { teams, matches } = useWorldCupData();
  const team = teams.find((item) => item.id === Number(teamId));
  const [sortKey, setSortKey] = useState<SortKey>("marketValueEur");

  const players = useMemo(() => {
    if (!team) return [];
    return [...team.players].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));
  }, [team, sortKey]);

  if (!team) {
    return (
      <main className="shell page-state">
        <h1>Team not found</h1>
        <Link to="/squads">Back to squads</Link>
      </main>
    );
  }

  const teamMatches = matches
    .filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

  return (
    <main className="shell">
      <Link to="/squads" className="back-link">
        <ArrowLeft size={16} /> Squads
      </Link>

      <section className="team-hero">
        <TeamBadge team={team} size="lg" showCode />
        <div>
          <span className="eyebrow">Group {team.groupLetter} · {team.confederation}</span>
          <h1>{team.teamName}</h1>
          <p>{team.managerName} · FIFA #{team.fifaRanking} · Elo {team.eloRating}</p>
        </div>
        <div className="form-strip" aria-label="Recent form">
          {team.form.length ? (
            team.form.map((result, index) => (
              <span className={resultClass(result)} key={`${result}-${index}`}>{result}</span>
            ))
          ) : (
            <small>No completed matches</small>
          )}
        </div>
      </section>

      <section className="kpi-grid">
        <StatCard label="Squad Value" value={formatCompactCurrency(team.squadValueEur)} detail={`Rank #${team.ranks.squadValue}`} />
        <StatCard label="Points" value={team.standing.points} detail={`${team.standing.played} played`} tone="green" />
        <StatCard label="xG Difference" value={team.standing.xgDifference > 0 ? `+${team.standing.xgDifference}` : team.standing.xgDifference} />
        <StatCard label="Cards" value={team.cards} detail="Yellow + red" tone="red" />
      </section>

      <section className="two-column wide-left">
        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Most valuable XI</span>
              <h2>Squad pitch</h2>
            </div>
          </div>
          <SquadPitch players={team.players} />
        </article>
        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Roster leaders</span>
              <h2>Top players</h2>
            </div>
          </div>
          <BarList
            items={team.topPlayers}
            getLabel={(player) => player.playerName}
            getValue={(player) => player.marketValueMillions}
            getDetail={(player) => `${player.position} · ${player.clubTeam}`}
            valuePrefix="€"
            valueSuffix="M"
          />
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="section-heading">
            <h2>Fixture path</h2>
          </div>
          <div className="result-list compact">
            {teamMatches.map((match) => {
              const opponent = match.homeTeamId === team.id ? match.awayTeam : match.homeTeam;
              return (
                <Link to={`/matches/${match.id}`} key={match.id}>
                  <span>{match.date}</span>
                  <strong>{match.status === "Completed" ? match.scoreline : "Scheduled"}</strong>
                  <span>{opponent.teamName}</span>
                  <small>{match.venue?.city}</small>
                </Link>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h2>Team profile</h2>
          </div>
          <dl className="fact-list">
            <div><dt>Average age</dt><dd>{team.avgAge}</dd></div>
            <div><dt>Average height</dt><dd>{team.avgHeightCm} cm</dd></div>
            <div><dt>Average caps</dt><dd>{team.avgCaps}</dd></div>
            <div><dt>Avg possession</dt><dd>{team.statsAverage.sampleSize ? `${team.statsAverage.avgPossession}%` : "N/A"}</dd></div>
          </dl>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Player registry</span>
            <h2>Full squad</h2>
          </div>
          <label className="sort-control">
            <ArrowUpDown size={16} />
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
              <option value="marketValueEur">Market value</option>
              <option value="caps">Caps</option>
              <option value="internationalGoals">International goals</option>
              <option value="age">Age</option>
            </select>
          </label>
        </div>
        <div className="table-scroll">
          <table className="player-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Pos</th>
                <th>Club</th>
                <th>Value</th>
                <th>Caps</th>
                <th>Goals</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player: PlayerProfile) => (
                <tr key={player.id}>
                  <td><strong>{player.playerName}</strong></td>
                  <td>{player.position}</td>
                  <td>{player.clubTeam}</td>
                  <td>{formatCurrency(player.marketValueEur)}</td>
                  <td>{player.caps}</td>
                  <td>{player.internationalGoals}</td>
                  <td>{player.age ?? "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
