import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PositionMix } from "../components/Charts";
import { GeoBubbleMap } from "../components/GeoBubbleMap";
import { TeamBadge } from "../components/TeamBadge";
import { useWorldCupData } from "../lib/data";
import { formatCompactCurrency } from "../lib/format";

export function SquadsPage() {
  const { teams } = useWorldCupData();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [confederation, setConfederation] = useState("All");
  const confederations = ["All", ...Array.from(new Set(teams.map((team) => team.confederation))).sort()];

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return teams
      .filter((team) => confederation === "All" || team.confederation === confederation)
      .filter((team) => {
        if (!normalized) return true;
        return `${team.teamName} ${team.fifaCode} ${team.managerName}`.toLowerCase().includes(normalized);
      })
      .sort((a, b) => b.squadValueEur - a.squadValueEur);
  }, [teams, confederation, query]);

  return (
    <main className="shell">
      <section className="page-heading row-heading">
        <div>
          <span className="eyebrow">Squads</span>
          <h1>Team economies, roster shape, and player drilldowns.</h1>
        </div>
        <div className="toolbar">
          <label className="search-box">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search squads" />
          </label>
          <select value={confederation} onChange={(event) => setConfederation(event.target.value)}>
            {confederations.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel squad-map-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Global squad economy</span>
            <h2>Squad value by country</h2>
          </div>
          <span>{filtered.length} teams shown</span>
        </div>
        <GeoBubbleMap
          ariaLabel="World map of squad market values"
          viewport={{
            minLon: -178,
            maxLon: 178,
            minLat: -53,
            maxLat: 72
          }}
          bubbles={filtered
            .filter((team) => team.countryLatitude !== null && team.countryLongitude !== null)
            .map((team) => ({
              id: team.id,
              longitude: team.countryLongitude ?? 0,
              latitude: team.countryLatitude ?? 0,
              value: team.squadValueEur,
              label: team.teamName,
              flagCode: team.flagCode,
              detail: `${formatCompactCurrency(team.squadValueEur)} · Group ${team.groupLetter} · Elo ${team.eloRating}`
            }))}
          onSelectBubble={(bubble) => navigate(`/squads/${bubble.id}`)}
          legend={<span>Bubble area follows total squad market value. Filter controls above update this map and the cards.</span>}
        />
      </section>

      <section className="squad-grid">
        {filtered.map((team) => (
          <Link className="squad-card" to={`/squads/${team.id}`} key={team.id}>
            <div className="squad-card-top">
              <TeamBadge team={team} showCode />
              <span>#{team.ranks.squadValue} value</span>
            </div>
            <div className="squad-card-value">
              <strong>{formatCompactCurrency(team.squadValueEur)}</strong>
              <small>
                Group {team.groupLetter} · Elo {team.eloRating} · FIFA #{team.fifaRanking}
              </small>
            </div>
            <PositionMix counts={team.positionCounts} />
            <div className="squad-card-footer">
              <span>{team.avgAge} avg age</span>
              <span>{team.avgCaps} avg caps</span>
              <span>{team.standing.points} pts</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
