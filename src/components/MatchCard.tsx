import type { Entry, Match, Player } from '../types';
import { Avatar } from './Avatar';
import { entryName } from '../store';
import { isPlayed, winnerOf } from '../lib/standings';
import { tintColor } from '../lib/colors';

interface Props {
  match: Match;
  entries: Entry[];
  players: Player[];
  label: string;
  onClick?: () => void;
  highlightFinal?: boolean;
}

function Side({ entry, players }: { entry: Entry | undefined; players: Player[] }) {
  const ps = (entry?.playerIds ?? []).map((id) => players.find((p) => p.id === id));
  const isPair = ps.length > 1;
  return (
    <div className="flex w-[34%] min-w-0 flex-col items-center gap-1">
      <Avatar players={ps} size={isPair ? 30 : 34} />
      {isPair ? (
        <span className="flex w-full flex-col text-center text-[12px] leading-tight font-semibold text-white/90">
          {ps.map((p, i) => (
            <span key={i} className="truncate">
              {p?.name ?? '?'}
            </span>
          ))}
        </span>
      ) : (
        <span
          className="w-full truncate text-center text-[13px] leading-tight font-semibold text-white/90"
          title={entryName(entry, players)}
        >
          {entryName(entry, players)}
        </span>
      )}
    </div>
  );
}

export function MatchCard({ match, entries, players, label, onClick, highlightFinal }: Props) {
  const home = entries.find((e) => e.id === match.homeEntryId);
  const away = entries.find((e) => e.id === match.awayEntryId);
  const played = isPlayed(match);
  const winner = winnerOf(match);
  const homeSeed = home?.playerIds[0] ?? match.homeEntryId;
  const awaySeed = away?.playerIds[0] ?? match.awayEntryId;

  const scoreCls = (entryId: string) =>
    `num text-[44px] leading-none font-bold w-9 text-center ${
      played && winner !== entryId ? 'text-white/35' : 'text-white'
    }`;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`relative block w-full overflow-hidden rounded-2xl bg-card text-left transition active:scale-[0.99] ${
        highlightFinal ? 'ring-1 ring-accent/60' : ''
      }`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${tintColor(homeSeed)} 0%, transparent 42%, transparent 58%, ${tintColor(awaySeed)} 100%)`,
      }}
    >
      <div className="pt-1.5 text-center text-[11px] font-semibold tracking-wide text-white/50">{label}</div>
      <div className="flex items-center justify-between px-2 pb-2.5">
        <Side entry={home} players={players} />
        <div className="flex flex-1 items-center justify-between">
          <span className={scoreCls(match.homeEntryId)}>{played ? match.homeLegs : ''}</span>
          <span className="flex flex-col items-center">
            {played ? (
              <span className="num text-[17px] font-semibold text-white/90">Result</span>
            ) : (
              <>
                <span className="num text-[20px] font-semibold text-white/80">vs</span>
                {onClick && <span className="text-[10px] font-medium whitespace-nowrap text-accent">Tap to score</span>}
              </>
            )}
          </span>
          <span className={scoreCls(match.awayEntryId)}>{played ? match.awayLegs : ''}</span>
        </div>
        <Side entry={away} players={players} />
      </div>
      {played && winner && (
        <span
          className={`absolute top-1/2 -translate-y-1/2 text-[11px] text-white/80 ${
            winner === match.homeEntryId ? 'left-1.5' : 'right-1.5'
          }`}
          aria-label="Winner"
        >
          ★
        </span>
      )}
    </button>
  );
}
