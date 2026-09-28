import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Layout, SectionLabel } from '../components/Layout';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { MatchCard } from '../components/MatchCard';
import { ScoreSheet } from '../components/ScoreSheet';
import { StandingsTable } from '../components/StandingsTable';
import { Avatar } from '../components/Avatar';
import { entryName, useStore } from '../store';
import type { Match, Player, Tournament } from '../types';
import { computeStandings, isPlayed, winnerOf } from '../lib/standings';
import { byeForRound } from '../lib/roundRobin';
import { groupComplete, PLAYOFF_PLACES } from '../lib/playoffs';
import { formatDate } from '../lib/format';

type Tab = 'fixtures' | 'table' | 'playoffs';

function matchLabel(m: Match): string {
  if (m.stage === 'semi') return `Semi-final ${m.round}`;
  if (m.stage === 'final') return 'Final';
  return `Round ${m.round}`;
}

export function TournamentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = useStore((s) => s.tournaments.find((x) => x.id === id));
  const players = useStore((s) => s.players);
  const recordScore = useStore((s) => s.recordScore);
  const deleteTournament = useStore((s) => s.deleteTournament);
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Match | null>(null);
  const [menu, setMenu] = useState(false);

  const nameOf = (entryId: string) => entryName(t?.entries.find((e) => e.id === entryId), players);
  const standings = useMemo(
    () => (t ? computeStandings(t.entries, t.matches, nameOf) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, players],
  );

  if (!t) {
    return (
      <Layout title="Not found" back>
        <p className="mt-6 text-center text-muted">
          This tournament doesn't exist. <Link to="/" className="text-accent underline">Go home</Link>
        </p>
      </Layout>
    );
  }

  const defaultTab: Tab = t.status === 'group' ? 'fixtures' : 'playoffs';
  const tab = (params.get('tab') as Tab) || defaultTab;
  const setTab = (next: Tab) => setParams({ tab: next }, { replace: true });

  const group = t.matches.filter((m) => m.stage === 'group');
  const playedCount = group.filter(isPlayed).length;
  const hasPlayoffs = t.entries.length >= PLAYOFF_PLACES;

  return (
    <Layout
      title={t.name}
      back
      right={
        <div className="relative">
          <button
            onClick={() => setMenu(!menu)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg hover:bg-white/20"
            aria-label="More"
          >
            ⋯
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
              <div className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-xl bg-card-2 shadow-xl">
                {t.status !== 'group' && (
                  <button
                    className="block w-full px-4 py-3 text-left text-[15px] hover:bg-line"
                    onClick={() => {
                      setMenu(false);
                      if (confirm('Remove the play-off matches and go back to the group stage?'))
                        useStore.getState().cancelPlayoffs(t.id);
                    }}
                  >
                    Reset play-offs
                  </button>
                )}
                <button
                  className="block w-full px-4 py-3 text-left text-[15px] text-danger hover:bg-line"
                  onClick={() => {
                    setMenu(false);
                    if (confirm(`Delete "${t.name}"? This cannot be undone.`)) {
                      deleteTournament(t.id);
                      navigate('/', { replace: true });
                    }
                  }}
                >
                  Delete tournament
                </button>
              </div>
            </>
          )}
        </div>
      }
      below={
        <>
          <div className="px-4 pb-1 text-[13px] text-white/60">
            {formatDate(t.date)} · {t.type === 'pairs' ? 'Pairs' : 'Singles'} · Best of {t.bestOf} · {playedCount}/
            {group.length} played
          </div>
          <SegmentedTabs<Tab>
            tabs={[
              { id: 'fixtures', label: 'Fixtures' },
              { id: 'table', label: 'Table' },
              ...(hasPlayoffs ? [{ id: 'playoffs' as Tab, label: 'Play-offs' }] : []),
            ]}
            value={tab}
            onChange={setTab}
          />
        </>
      }
    >
      {tab === 'fixtures' && <Fixtures t={t} players={players} onEdit={setEditing} />}
      {tab === 'table' && (
        <>
          <div className="mt-2" />
          <StandingsTable rows={standings} entries={t.entries} players={players} />
          <p className="mt-3 px-1 text-[12px] leading-relaxed text-muted">
            2 points per win. Ranked on points, then leg difference (LF − LA), then legs for.
            {hasPlayoffs && ' Top 4 qualify for the play-offs.'}
          </p>
          {t.status === 'group' && hasPlayoffs && groupComplete(t.matches) && (
            <Button
              className="mt-4 w-full"
              onClick={() => {
                useStore.getState().startPlayoffs(t.id);
                setTab('playoffs');
              }}
            >
              Start play-offs →
            </Button>
          )}
        </>
      )}
      {tab === 'playoffs' && hasPlayoffs && (
        <Playoffs t={t} players={players} standings={standings.map((r) => r.entryId)} onEdit={setEditing} onGoToTab={setTab} />
      )}

      {editing && (
        <ScoreSheet
          key={editing.id}
          match={editing}
          label={matchLabel(editing)}
          entries={t.entries}
          players={players}
          bestOf={t.bestOf}
          onClose={() => setEditing(null)}
          onSave={(h, a) => {
            recordScore(t.id, editing.id, h, a);
            setEditing(null);
          }}
          onClear={() => {
            recordScore(t.id, editing.id, undefined, undefined);
            setEditing(null);
          }}
        />
      )}
    </Layout>
  );
}

function Fixtures({ t, players, onEdit }: { t: Tournament; players: Player[]; onEdit: (m: Match) => void }) {
  const [showPlayed, setShowPlayed] = useState(true);
  const group = t.matches.filter((m) => m.stage === 'group');
  const rounds = Math.max(0, ...group.map((m) => m.round));
  const entryIds = t.entries.map((e) => e.id);

  return (
    <>
      <div className="mt-1 flex justify-end">
        <button onClick={() => setShowPlayed(!showPlayed)} className="px-1 text-[13px] font-medium text-white/60">
          {showPlayed ? 'Hide played' : 'Show played'}
        </button>
      </div>
      {Array.from({ length: rounds }, (_, i) => i + 1).map((r) => {
        const inRound = group.filter((m) => m.round === r);
        const visible = showPlayed ? inRound : inRound.filter((m) => !isPlayed(m));
        if (visible.length === 0) return null;
        const bye = byeForRound(entryIds, group, r);
        const done = inRound.every(isPlayed);
        return (
          <div key={r}>
            <SectionLabel
              right={
                <span className="normal-case tracking-normal">
                  {bye ? `Bye: ${entryName(t.entries.find((e) => e.id === bye), players)}` : done ? '✓ Complete' : ''}
                </span>
              }
            >
              Round {r}
            </SectionLabel>
            <div className="space-y-2">
              {visible.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  entries={t.entries}
                  players={players}
                  label={matchLabel(m)}
                  onClick={() => onEdit(m)}
                />
              ))}
            </div>
          </div>
        );
      })}
      {!showPlayed && group.every(isPlayed) && (
        <p className="mt-10 text-center text-muted">All group matches played ✓</p>
      )}
    </>
  );
}

function Playoffs({
  t,
  players,
  standings,
  onEdit,
  onGoToTab,
}: {
  t: Tournament;
  players: Player[];
  standings: string[];
  onEdit: (m: Match) => void;
  onGoToTab: (tab: Tab) => void;
}) {
  const semis = t.matches.filter((m) => m.stage === 'semi').sort((a, b) => a.round - b.round);
  const final = t.matches.find((m) => m.stage === 'final');
  const champion = final && winnerOf(final);
  const championEntry = t.entries.find((e) => e.id === champion);

  if (t.status === 'group') {
    const complete = groupComplete(t.matches);
    const remaining = t.matches.filter((m) => m.stage === 'group' && !isPlayed(m)).length;
    const seed = (i: number) => entryName(t.entries.find((e) => e.id === standings[i]), players);
    return (
      <div className="mt-2">
        <div className="rounded-2xl bg-card p-4 text-center">
          {complete ? (
            <>
              <p className="text-[15px]">All group matches are played.</p>
              <Button className="mt-3 w-full" onClick={() => useStore.getState().startPlayoffs(t.id)}>
                Start play-offs
              </Button>
            </>
          ) : (
            <p className="text-[15px] text-white/80">
              Play-offs unlock when all group matches are played ({remaining} to go).
            </p>
          )}
        </div>
        <SectionLabel>{complete ? 'Semi-finals' : 'If it finished now'}</SectionLabel>
        <div className="space-y-2">
          {[
            [0, 3],
            [1, 2],
          ].map(([a, b], i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 text-[15px]">
              <span className="w-24 text-[11px] font-semibold tracking-wide text-muted uppercase">Semi-final {i + 1}</span>
              <span className="flex-1 truncate text-right font-medium">
                <span className="num text-accent">{a + 1}</span> {seed(a)}
              </span>
              <span className="px-2 text-muted">v</span>
              <span className="flex-1 truncate font-medium">
                {seed(b)} <span className="num text-accent">{b + 1}</span>
              </span>
            </div>
          ))}
        </div>
        <button onClick={() => onGoToTab('fixtures')} className="mt-4 w-full text-center text-[14px] text-accent">
          Go to fixtures →
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      {championEntry && (
        <div className="mb-4 flex flex-col items-center rounded-2xl bg-gradient-to-b from-amber-500/25 to-card px-4 py-6 text-center">
          <div className="text-4xl">🏆</div>
          <div className="mt-2 mb-3 text-[12px] font-semibold tracking-wider text-amber-300 uppercase">Champion</div>
          <Avatar players={championEntry.playerIds.map((id) => players.find((p) => p.id === id))} size={56} />
          <div className="mt-2 text-[24px] font-bold">{entryName(championEntry, players)}</div>
        </div>
      )}
      <SectionLabel>Semi-finals</SectionLabel>
      <div className="space-y-2">
        {semis.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            entries={t.entries}
            players={players}
            label={`${matchLabel(m)} · ${m.round === 1 ? '1st v 4th' : '2nd v 3rd'}`}
            onClick={() => onEdit(m)}
          />
        ))}
      </div>
      <SectionLabel>Final</SectionLabel>
      {final ? (
        <MatchCard match={final} entries={t.entries} players={players} label="Final" onClick={() => onEdit(final)} highlightFinal />
      ) : (
        <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-[14px] text-muted">
          Winners of the semi-finals meet here
        </div>
      )}
    </div>
  );
}
