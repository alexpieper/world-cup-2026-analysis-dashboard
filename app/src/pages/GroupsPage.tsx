import { Link } from "react-router-dom";
import { TeamBadge } from "../components/TeamBadge";
import { useWorldCupData } from "../lib/data";

export function GroupsPage() {
  const { standings, teams } = useWorldCupData();
  const teamById = new Map(teams.map((team) => [team.id, team]));

  return (
    <main className="shell">
      <section className="page-heading">
        <span className="eyebrow">Group stage</span>
        <h1>Standings, form, and xG pressure by group.</h1>
      </section>

      <section className="group-grid">
        {standings.map((group) => (
          <article className="panel group-table-panel" key={group.groupLetter}>
            <div className="section-heading">
              <h2>Group {group.groupLetter}</h2>
              <span>{group.teams.reduce((sum, team) => sum + team.played, 0) / 2} matches played</span>
            </div>
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>P</th>
                  <th>GD</th>
                  <th>Pts</th>
                  <th>xGD</th>
                </tr>
              </thead>
              <tbody>
                {group.teams.map((row) => {
                  const team = teamById.get(row.teamId);
                  return (
                    <tr key={row.teamId}>
                      <td>
                        {team ? (
                          <Link to={`/squads/${team.id}`}>
                            <TeamBadge team={team} size="sm" showCode />
                          </Link>
                        ) : (
                          row.teamName
                        )}
                      </td>
                      <td>{row.played}</td>
                      <td>
                        {row.goalDifference > 0 ? "+" : ""}
                        {row.goalDifference}
                      </td>
                      <td>
                        <strong>{row.points}</strong>
                      </td>
                      <td>
                        {row.xgDifference > 0 ? "+" : ""}
                        {row.xgDifference}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </article>
        ))}
      </section>
    </main>
  );
}
