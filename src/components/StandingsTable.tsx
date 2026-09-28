import { Fragment } from 'react';
import type { Entry, Player, StandingRow } from '../types';
import { Avatar } from './Avatar';
import { entryName } from '../store';
import { PLAYOFF_PLACES } from '../lib/playoffs';

interface Props {
  rows: StandingRow[];
  entries: Entry[];
  players: Player[];
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export function StandingsTable({ rows, entries, players }: Props) {
  const showCut = rows.length > PLAYOFF_PLACES;
  const th = 'px-1 py-2 text-center font-semibold';
  const td = 'num px-0.5 py-2.5 text-center text-[17px]';

  return (
    <div className="overflow-hidden rounded-2xl bg-card">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-7" />
          <col />
          <col className="w-6 sm:w-8" />
          <col className="w-6 sm:w-8" />
          <col className="w-6 sm:w-8" />
          <col className="w-7 sm:w-9" />
          <col className="w-7 sm:w-9" />
          <col className="w-8 sm:w-10" />
          <col className="w-9 sm:w-11" />
        </colgroup>
        <thead>
          <tr className="border-b border-line text-[11px] tracking-wide text-muted uppercase">
            <th className={th}>#</th>
            <th className={`${th} text-left`}>Player</th>
            <th className={th} title="Played">P</th>
            <th className={th} title="Won">W</th>
            <th className={th} title="Lost">L</th>
            <th className={th} title="Legs for">LF</th>
            <th className={th} title="Legs against">LA</th>
            <th className={th} title="Leg difference">LD</th>
            <th className={`${th} text-white`} title="Points">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const entry = entries.find((e) => e.id === r.entryId);
            const ps = (entry?.playerIds ?? []).map((id) => players.find((p) => p.id === id));
            const qualifies = i < PLAYOFF_PLACES;
            return (
              <Fragment key={r.entryId}>
                <tr className={`${qualifies ? 'bg-accent/[0.09]' : ''} border-b border-line/50 last:border-0`}>
                  <td className="relative py-2.5 text-center">
                    {qualifies && <span className="absolute inset-y-1 left-0 w-1 rounded-r bg-accent" />}
                    <span className={`num text-[17px] font-bold ${qualifies ? 'text-accent' : 'text-muted'}`}>{i + 1}</span>
                  </td>
                  <td className="min-w-0 py-2 pr-1">
                    <div className="flex items-center gap-2">
                      <span className="hidden shrink-0 sm:inline">
                        <Avatar players={ps} size={24} />
                      </span>
                      <span className="line-clamp-2 text-[14px] leading-tight font-semibold break-words">
                        {entryName(entry, players)}
                      </span>
                    </div>
                  </td>
                  <td className={`${td} text-white/70`}>{r.played}</td>
                  <td className={td}>{r.won}</td>
                  <td className={td}>{r.lost}</td>
                  <td className={`${td} text-white/70`}>{r.legsFor}</td>
                  <td className={`${td} text-white/70`}>{r.legsAgainst}</td>
                  <td className={td}>{signed(r.legDiff)}</td>
                  <td className={`${td} text-[19px] font-bold`}>{r.points}</td>
                </tr>
                {showCut && i === PLAYOFF_PLACES - 1 && (
                  <tr aria-hidden>
                    <td colSpan={9} className="p-0">
                      <div className="flex items-center gap-2 px-3 py-1">
                        <span className="h-px flex-1 border-t border-dashed border-accent/60" />
                        <span className="text-[10px] font-semibold tracking-wider text-accent uppercase">Play-off line</span>
                        <span className="h-px flex-1 border-t border-dashed border-accent/60" />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
