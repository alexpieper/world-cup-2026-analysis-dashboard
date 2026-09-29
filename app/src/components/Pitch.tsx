import type { LineupPlayer, PlayerProfile, PositionCode } from "../types/data";
import { formatCompactCurrency, positionOrder, teamInitials } from "../lib/format";

const lanes: Record<PositionCode, { y: number; slots: number }> = {
  GK: { y: 88, slots: 1 },
  DEF: { y: 65, slots: 5 },
  MID: { y: 42, slots: 5 },
  FWD: { y: 18, slots: 5 }
};

function pickSquadXI(players: PlayerProfile[]) {
  const byPosition = positionOrder.reduce(
    (acc, position) => {
      acc[position] = players
        .filter((player) => player.position === position)
        .sort((a, b) => b.marketValueEur - a.marketValueEur);
      return acc;
    },
    {} as Record<PositionCode, PlayerProfile[]>
  );

  return [
    ...byPosition.GK.slice(0, 1),
    ...byPosition.DEF.slice(0, 4),
    ...byPosition.MID.slice(0, 3),
    ...byPosition.FWD.slice(0, 3)
  ];
}

function laneX(index: number, total: number) {
  if (total <= 1) return 50;
  return 18 + (index / (total - 1)) * 64;
}

export function SquadPitch({ players }: { players: PlayerProfile[] }) {
  const xi = pickSquadXI(players);
  const grouped = positionOrder.flatMap((position) => {
    const row = xi.filter((player) => player.position === position);
    return row.map((player, index) => ({
      player,
      x: laneX(index, row.length),
      y: lanes[position].y
    }));
  });

  return (
    <div className="pitch">
      <PitchMarkings />
      {grouped.map(({ player, x, y }) => (
        <div className="pitch-player" key={player.id} style={{ left: `${x}%`, top: `${y}%` }}>
          <strong className={(player.shortName || player.playerName).length > 11 ? "fit-tight" : undefined}>
            {player.shortName || teamInitials(player.playerName)}
          </strong>
          <span>{player.position}</span>
          <span className="pitch-tooltip">
            {player.playerName} · {formatCompactCurrency(player.marketValueEur)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LineupPitch({ players }: { players: LineupPlayer[] }) {
  const starters = players.filter((player) => player.isStartingXi && player.minutesPlayed > 0);

  if (!starters.length) {
    return <p className="empty-copy">No starting XI has been published for this side yet.</p>;
  }

  const grouped = positionOrder.flatMap((position) => {
    const row = starters.filter((player) => player.tacticalPosition === position || player.position === position);
    return row.map((player, index) => ({
      player,
      x: laneX(index, row.length),
      y: lanes[position].y
    }));
  });

  return (
    <div className="pitch lineup-pitch">
      <PitchMarkings />
      {grouped.map(({ player, x, y }) => {
        const shortName = player.shortName || teamInitials(player.playerName);
        return (
          <div
            className="pitch-player"
            key={player.id}
            style={{ left: `${x}%`, top: `${y}%` }}
            tabIndex={0}
            aria-label={`${player.playerName}, ${player.tacticalPosition}, ${player.minutesPlayed} minutes`}
          >
            <strong className={shortName.length > 11 ? "fit-tight" : undefined}>{shortName}</strong>
            <span>
              {player.tacticalPosition} · {player.minutesPlayed}'
            </span>
            <span className="pitch-tooltip">
              {player.playerName} · {formatCompactCurrency(player.marketValueEur)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PitchMarkings() {
  return (
    <>
      <span className="pitch-marking pitch-halfway" aria-hidden="true" />
      <span className="pitch-marking pitch-center-circle" aria-hidden="true" />
      <span className="pitch-marking pitch-box pitch-box-top" aria-hidden="true" />
      <span className="pitch-marking pitch-box pitch-box-bottom" aria-hidden="true" />
      <span className="pitch-marking pitch-six pitch-six-top" aria-hidden="true" />
      <span className="pitch-marking pitch-six pitch-six-bottom" aria-hidden="true" />
      <span className="pitch-marking pitch-goal pitch-goal-top" aria-hidden="true" />
      <span className="pitch-marking pitch-goal pitch-goal-bottom" aria-hidden="true" />
    </>
  );
}
