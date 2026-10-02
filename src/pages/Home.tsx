import { Link } from 'react-router-dom';
import { Layout, Pill, SectionLabel } from '../components/Layout';
import { entryName, useStore } from '../store';
import type { Tournament } from '../types';
import { formatDate } from '../lib/format';
import { computeStandings, isPlayed, winnerOf } from '../lib/standings';

function statusText(t: Tournament): string {
  const group = t.matches.filter((m) => m.stage === 'group');
  const played = group.filter(isPlayed).length;
  if (t.status === 'group') return `Group · ${played}/${group.length} played`;
  if (t.status === 'playoffs') {
    return t.matches.some((m) => m.stage === 'final') ? 'Final to play' : 'Semi-finals';
  }
  return 'Complete';
}

function TournamentRow({ t }: { t: Tournament }) {
  const players = useStore((s) => s.players);
  const final = t.matches.find((m) => m.stage === 'final');
  const champ =
    (final && winnerOf(final)) ||
    (t.status === 'complete' && !final ? computeStandings(t.entries, t.matches, (id) => entryName(t.entries.find((e) => e.id === id), players))[0]
          ?.entryId : undefined);
  return (
    <Link
      to={`/t/${t.id}`}
      className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 transition hover:bg-card-2 active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[17px] font-semibold">{t.name}</span>
          {t.type === 'pairs' && (
            <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white/70 uppercase">
              Pairs
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[13px] text-muted">
          {formatDate(t.date)} · {t.entries.length} {t.type === 'pairs' ? 'pairs' : 'players'}
        </div>
        <div className={`mt-1 text-[13px] font-medium ${t.status === 'complete' ? 'text-white/70' : 'text-accent'}`}>
          {champ ? `🏆 ${entryName(t.entries.find((e) => e.id === champ), players)}` : statusText(t)}
        </div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/30">
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

export function Home() {
  const tournaments = useStore((s) => s.tournaments);
  const playerCount = useStore((s) => s.players.filter((p) => p.active).length);
  const live = tournaments.filter((t) => t.status !== 'complete');
  const done = tournaments.filter((t) => t.status === 'complete');

  return (
    <Layout
      title="EBDO Darts"
      big
      right={
        <div className="flex gap-2">
          <Pill to="/players">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z" />
            </svg>
            Players
          </Pill>
          <Pill to="/settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-label="Settings">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </Pill>
        </div>
      }
    >
      <Link
        to="/new"
        className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-[16px] font-bold text-black transition hover:brightness-110 active:scale-[0.99]"
      >
        <span className="text-xl leading-none">+</span> New tournament
      </Link>
      <Link
        to="/stats"
        className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-card py-3 text-[15px] font-semibold text-white transition hover:bg-card-2 active:scale-[0.99]"
      >
        📊 Player stats
      </Link>
      {playerCount === 0 && (
        <p className="mt-3 px-1 text-center text-[13px] text-muted">
          Tip: add your regulars on the{' '}
          <Link to="/players" className="text-accent underline">
            Players
          </Link>{' '}
          page first — you can also add new players while setting up an event.
        </p>
      )}

      {live.length > 0 && (
        <>
          <SectionLabel>In progress</SectionLabel>
          <div className="space-y-2">
            {live.map((t) => (
              <TournamentRow key={t.id} t={t} />
            ))}
          </div>
        </>
      )}

      {done.length > 0 && (
        <>
          <SectionLabel>Completed</SectionLabel>
          <div className="space-y-2">
            {done.map((t) => (
              <TournamentRow key={t.id} t={t} />
            ))}
          </div>
        </>
      )}

      {tournaments.length === 0 && (
        <div className="mt-12 text-center text-muted">
          <div className="text-5xl">🎯</div>
          <p className="mt-3 text-[15px]">No tournaments yet.</p>
        </div>
      )}
    </Layout>
  );
}
