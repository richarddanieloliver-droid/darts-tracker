import { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { Avatar } from '../components/Avatar';
import { useStore } from '../store';
import { computePlayerStats, formatPct, type PlayerStats, type StatsFilter } from '../lib/playerStats';

type SortKey = 'played' | 'won' | 'lost' | 'legsWon' | 'legsLost' | 'legWinPct';

const COLUMNS: { key: SortKey; label: string; title: string }[] = [
  { key: 'played', label: 'P', title: 'Matches played' },
  { key: 'won', label: 'W', title: 'Matches won' },
  { key: 'lost', label: 'L', title: 'Matches lost' },
  { key: 'legsWon', label: 'LW', title: 'Legs won' },
  { key: 'legsLost', label: 'LL', title: 'Legs lost' },
  { key: 'legWinPct', label: 'Leg %', title: 'Legs won as a % of legs played' },
];

export function Stats() {
  const tournaments = useStore((s) => s.tournaments);
  const players = useStore((s) => s.players);
  const [filter, setFilter] = useState<StatsFilter>('all');
  const [sort, setSort] = useState<SortKey>('legWinPct');

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '?';

  const rows = useMemo(() => {
    const value = (s: PlayerStats) => (sort === 'legWinPct' ? (s.legWinPct ?? -1) : s[sort]);
    return computePlayerStats(tournaments, filter).sort(
      (a, b) =>
        value(b) - value(a) ||
        (b.legWinPct ?? -1) - (a.legWinPct ?? -1) ||
        b.played - a.played ||
        nameOf(a.playerId).localeCompare(nameOf(b.playerId)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournaments, players, filter, sort]);

  const th = 'px-0.5 py-2 text-center font-semibold cursor-pointer select-none';
  const td = 'num px-0.5 py-2.5 text-center text-[17px]';

  return (
    <Layout
      title="Player stats"
      back
      below={
        <SegmentedTabs<StatsFilter>
          tabs={[
            { id: 'all', label: 'All' },
            { id: 'singles', label: 'Singles' },
            { id: 'pairs', label: 'Pairs' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      }
    >
      {rows.length === 0 ? (
        <div className="mt-12 text-center text-muted">
          <div className="text-5xl">📊</div>
          <p className="mt-3 text-[15px]">
            No results yet{filter !== 'all' ? ` for ${filter}` : ''}. Stats appear once matches are scored.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-2 overflow-hidden rounded-2xl bg-card">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-7" />
                <col />
                <col className="w-7 sm:w-9" />
                <col className="w-7 sm:w-9" />
                <col className="w-7 sm:w-9" />
                <col className="w-8 sm:w-10" />
                <col className="w-8 sm:w-10" />
                <col className="w-14 sm:w-16" />
              </colgroup>
              <thead>
                <tr className="border-b border-line text-[11px] tracking-wide text-muted uppercase">
                  <th className="px-1 py-2 text-center font-semibold">#</th>
                  <th className="px-1 py-2 text-left font-semibold">Player</th>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      title={c.title}
                      aria-sort={sort === c.key ? 'descending' : undefined}
                      onClick={() => setSort(c.key)}
                      className={`${th} ${sort === c.key ? 'text-accent' : ''}`}
                    >
                      {c.label}
                      {sort === c.key && <span aria-hidden>▾</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => {
                  const player = players.find((p) => p.id === s.playerId);
                  return (
                    <tr key={s.playerId} className="border-b border-line/50 last:border-0">
                      <td className="num py-2.5 text-center text-[17px] font-bold text-muted">{i + 1}</td>
                      <td className="min-w-0 py-2 pr-1">
                        <div className="flex items-center gap-2">
                          <span className="hidden shrink-0 sm:inline">
                            <Avatar players={[player]} size={24} />
                          </span>
                          <span
                            className={`line-clamp-2 text-[14px] leading-tight font-semibold break-words ${
                              player?.active === false ? 'text-muted' : ''
                            }`}
                          >
                            {nameOf(s.playerId)}
                          </span>
                        </div>
                      </td>
                      <td className={`${td} text-white/70`}>{s.played}</td>
                      <td className={td}>{s.won}</td>
                      <td className={td}>{s.lost}</td>
                      <td className={`${td} text-white/70`}>{s.legsWon}</td>
                      <td className={`${td} text-white/70`}>{s.legsLost}</td>
                      <td className={`${td} font-bold`}>{formatPct(s.legWinPct)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 px-1 text-[12px] leading-relaxed text-muted">
            Totals across every tournament, including play-offs. Leg % = legs won ÷ legs played × 100, to one
            decimal place. In pairs, both partners are credited with the pair's result. Tap a column to sort.
          </p>
        </>
      )}
    </Layout>
  );
}
