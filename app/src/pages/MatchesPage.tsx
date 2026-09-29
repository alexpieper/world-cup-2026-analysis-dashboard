import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CountryLabel } from "../components/Flag";
import { MatchExplorer } from "../components/MatchExplorer";
import { TeamBadge } from "../components/TeamBadge";
import { useWorldCupData } from "../lib/data";
import { formatKickoff, readableStatus } from "../lib/format";

export function MatchesPage() {
  const { matches } = useWorldCupData();
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return matches
      .filter((match) => status === "All" || match.status === status)
      .filter((match) => {
        if (!normalized) return true;
        return `${match.homeTeam.teamName} ${match.awayTeam.teamName} ${match.venue?.city ?? ""}`
          .toLowerCase()
          .includes(normalized);
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.kickoffTimeUtc.localeCompare(b.kickoffTimeUtc));
  }, [matches, query, status]);

  return (
    <main className="shell">
      <section className="page-heading row-heading">
        <div>
          <span className="eyebrow">Match center</span>
          <h1>Scores, xG, events, and lineups.</h1>
        </div>
        <div className="toolbar">
          <label className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search team or city"
            />
          </label>
          <div className="segmented-control">
            {["All", "Completed", "Scheduled"].map((item) => (
              <button
                className={status === item ? "is-active" : ""}
                key={item}
                type="button"
                onClick={() => setStatus(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <MatchExplorer />

      <section className="match-card-grid">
        {filtered.map((match) => (
          <Link className="match-card" to={`/matches/${match.id}`} key={match.id}>
            <div className="match-card-top">
              <span>{match.stage?.name}</span>
              <strong>{readableStatus(match)}</strong>
            </div>
            <div className="match-card-teams">
              <TeamBadge team={match.homeTeam} />
              <span className="versus">vs</span>
              <TeamBadge team={match.awayTeam} />
            </div>
            <div className="match-card-meta">
              <span>{formatKickoff(match)}</span>
              <span>
                {match.venue?.city}{" "}
                {match.venue ? <CountryLabel code={match.venue.flagCode} label={match.venue.country} /> : null}
              </span>
            </div>
            {match.status === "Completed" ? (
              <div className="xg-strip">
                <span>xG {match.homeXg}</span>
                <span>{match.totalGoals} goals</span>
                <span>xG {match.awayXg}</span>
              </div>
            ) : null}
          </Link>
        ))}
      </section>
    </main>
  );
}
