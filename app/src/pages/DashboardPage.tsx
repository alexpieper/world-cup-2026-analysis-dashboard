import { Activity, Goal, MapPin, Trophy, UsersRound, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { BarList } from "../components/Charts";
import { Flag } from "../components/Flag";
import { StatCard } from "../components/StatCard";
import { TeamBadge } from "../components/TeamBadge";
import { VenueMap } from "../components/VenueMap";
import { useWorldCupData } from "../lib/data";
import { formatCompactCurrency, formatDate, formatKickoff } from "../lib/format";

export function DashboardPage() {
  const { analytics, matches, standings, venues } = useWorldCupData();
  const selectedVenue = analytics.venueTrends[0] ?? venues[0];
  const nextMatches = matches
    .filter((match) => match.status !== "Completed")
    .sort((a, b) => a.date.localeCompare(b.date) || a.kickoffTimeUtc.localeCompare(b.kickoffTimeUtc))
    .slice(0, 5);
  const latestCompleted = matches
    .filter((match) => match.status === "Completed")
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .slice(0, 4);

  return (
    <main className="shell">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <span className="eyebrow">World Cup 2026 · Local data room</span>
          <h1>Tournament intelligence, squads, venues, and match signals in one cockpit.</h1>
          <p>
            The app rebuilds from the repository CSVs, then layers standings, xG deltas,
            squad economics, venue effects, and event timelines on top.
          </p>
        </div>
        <div className="hero-scoreboard">
          <span>Completed</span>
          <strong>{analytics.kpis.completedMatches}/{analytics.kpis.matches}</strong>
          <small>
            {analytics.kpis.goals} goals · {analytics.kpis.avgGoals} per match
          </small>
        </div>
      </section>

      <section className="kpi-grid">
        <StatCard label="Teams" value={analytics.kpis.teams} detail="12 groups of four" icon={UsersRound} />
        <StatCard label="Players" value={analytics.kpis.players} detail="26-player squads" icon={Activity} />
        <StatCard label="Squad Market" value={`€${analytics.kpis.totalSquadValueBillions}B`} icon={WalletCards} />
        <StatCard label="Goals" value={analytics.kpis.goals} detail="From completed matches" icon={Goal} tone="green" />
        <StatCard
          label="Venues"
          value={analytics.kpis.venues}
          detail={
            <span className="host-flag-row">
              <Flag code="us" label="USA" size="sm" />
              <Flag code="mx" label="Mexico" size="sm" />
              <Flag code="ca" label="Canada" size="sm" />
            </span>
          }
          icon={MapPin}
        />
        <StatCard label="Last Stats" value={analytics.kpis.lastStatsUpdated ?? "N/A"} icon={Trophy} tone="gold" />
      </section>

      <section className="two-column wide-left">
        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Host network</span>
              <h2>Venue map</h2>
            </div>
            <Link to="/venues">Explore venues</Link>
          </div>
          <VenueMap venues={venues} selectedVenueId={selectedVenue.id} />
        </article>

        <aside className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Hot stadium</span>
              <h2>{selectedVenue.city}</h2>
            </div>
          </div>
          <dl className="fact-list">
            <div>
              <dt>Stadium</dt>
              <dd>{selectedVenue.stadiumName}</dd>
            </div>
            <div>
              <dt>Matches</dt>
              <dd>{selectedVenue.matchCount}</dd>
            </div>
            <div>
              <dt>Avg goals</dt>
              <dd>{selectedVenue.avgGoals}</dd>
            </div>
            <div>
              <dt>Elevation</dt>
              <dd>{selectedVenue.elevationMeters}m</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Next up</span>
              <h2>Match ticker</h2>
            </div>
            <Link to="/matches">All matches</Link>
          </div>
          <div className="match-stack">
            {nextMatches.map((match) => (
              <Link className="match-strip" to={`/matches/${match.id}`} key={match.id}>
                <TeamBadge team={match.homeTeam} />
                <span className="match-strip-center">
                  <strong>{formatDate(match.date)}</strong>
                  <small>{match.kickoffTimeUtc} UTC · {match.venue?.city}</small>
                </span>
                <TeamBadge team={match.awayTeam} />
              </Link>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Latest results</span>
              <h2>Completed matches</h2>
            </div>
          </div>
          <div className="result-list">
            {latestCompleted.map((match) => (
              <Link to={`/matches/${match.id}`} key={match.id}>
                <span>{match.homeTeam.teamName}</span>
                <strong>{match.scoreline}</strong>
                <span>{match.awayTeam.teamName}</span>
                <small>{formatKickoff(match)}</small>
              </Link>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Economics</span>
              <h2>Most valuable squads</h2>
            </div>
            <Link to="/analytics">Stat lab</Link>
          </div>
          <BarList
            items={analytics.topSquads.slice(0, 6)}
            getLabel={(team) => team.teamName}
            getValue={(team) => team.squadValueMillions}
            getDetail={(team) => `Group ${team.groupLetter} · ${team.confederation}`}
            valuePrefix="€"
            valueSuffix="M"
          />
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Group pulse</span>
            <h2>Leaders across the 12 groups</h2>
          </div>
          <Link to="/groups">Open groups</Link>
        </div>
        <div className="group-pulse-grid">
          {standings.map((group) => {
            const leader = group.teams[0];
            return (
              <Link to="/groups" className="group-pulse" key={group.groupLetter}>
                <span>Group {group.groupLetter}</span>
                <strong>{leader.teamName}</strong>
                <small>
                  {leader.points} pts · {leader.goalDifference > 0 ? "+" : ""}
                  {leader.goalDifference} GD
                </small>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
