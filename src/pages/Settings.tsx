import { useRef, useState } from 'react';
import { Button, Layout, SectionLabel } from '../components/Layout';
import { useStore, type BackupData } from '../store';
import { todayIso } from '../lib/format';

export function Settings() {
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const resetAll = useStore((s) => s.resetAll);
  const counts = useStore((s) => `${s.players.length} players · ${s.tournaments.length} tournaments`);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebdo-darts-backup-${todayIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Backup downloaded.');
  };

  const doImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as BackupData;
      if (data.app !== 'ebdo-darts' || !Array.isArray(data.players) || !Array.isArray(data.tournaments)) {
        throw new Error('Not an EBDO Darts backup file');
      }
      if (!confirm(`Replace all current data with this backup (${data.players.length} players, ${data.tournaments.length} tournaments)?`)) return;
      importData(data);
      setMessage('Backup restored.');
    } catch (e) {
      setMessage(`Import failed: ${(e as Error).message}`);
    }
  };

  return (
    <Layout title="Settings" back>
      <SectionLabel>Your data</SectionLabel>
      <div className="rounded-2xl bg-card p-4 text-[14px] leading-relaxed text-white/80">
        <p>{counts}</p>
        <p className="mt-2 text-muted">
          Everything is saved on this device only. Download a backup regularly — you can restore it here or on
          another device.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={doExport} className="flex-1">
            ⬇ Backup
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()} className="flex-1">
            ⬆ Restore
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doImport(f);
            e.target.value = '';
          }}
        />
        {message && <p className="mt-3 text-accent">{message}</p>}
      </div>

      <SectionLabel>Danger zone</SectionLabel>
      <div className="rounded-2xl bg-card p-4">
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            if (confirm('Delete ALL players and tournaments from this device?') && confirm('Are you really sure?')) {
              resetAll();
              setMessage('All data deleted.');
            }
          }}
        >
          Delete all data
        </Button>
      </div>
    </Layout>
  );
}
