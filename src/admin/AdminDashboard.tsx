import { useCallback, useEffect, useMemo, useState } from 'react';
import { Lock, RefreshCw, Download, Trash2, AlertTriangle } from 'lucide-react';
import {
  getLocalLog,
  clearLocalLog,
  isRemoteConfigured,
  fetchRemoteEvents,
  type AnalyticsEvent,
  type PlatformKind,
} from '../utils/analytics';

const UNLOCK_KEY = 'stanzcalc.admin.unlocked';
const DAY_MS = 24 * 60 * 60 * 1000;
const PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE;

const PLATFORM_LABEL: Record<PlatformKind, string> = {
  'android-apk': 'Android (.apk)',
  'ios-pwa': 'iOS Home Screen',
  'ios-safari': 'iOS Safari',
  'web-desktop': 'Web / Desktop',
};

function uniqueDeviceCount(events: AnalyticsEvent[]): number {
  return new Set(events.map((e) => e.deviceId)).size;
}

function activeDevicesSince(events: AnalyticsEvent[], sinceMs: number): number {
  const ids = new Set<string>();
  for (const e of events) {
    if (e.event === 'app_session_start' && e.timestamp >= sinceMs) ids.add(e.deviceId);
  }
  return ids.size;
}

function platformBreakdown(events: AnalyticsEvent[]): Array<{ platform: PlatformKind; count: number }> {
  const latestPlatformByDevice = new Map<string, PlatformKind>();
  for (const e of events) latestPlatformByDevice.set(e.deviceId, e.platform);
  const counts = new Map<PlatformKind, number>();
  for (const platform of latestPlatformByDevice.values()) {
    counts.set(platform, (counts.get(platform) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);
}

function featurePopularity(events: AnalyticsEvent[]): Array<{ feature: string; count: number }> {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.event !== 'feature_used') continue;
    const feature = String(e.props?.feature ?? 'unknown');
    counts.set(feature, (counts.get(feature) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count);
}

function topCurrencyPairs(events: AnalyticsEvent[]): Array<{ pair: string; count: number }> {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.event !== 'feature_used' || e.props?.feature !== 'currency_convert') continue;
    const from = e.props?.from;
    const to = e.props?.to;
    if (!from || !to) continue;
    const pair = `${from} → ${to}`;
    counts.set(pair, (counts.get(pair) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function toCsv(events: AnalyticsEvent[]): string {
  const header = ['id', 'event', 'deviceId', 'platform', 'timestamp', 'iso_time', 'props'];
  const rows = events.map((e) => [
    e.id,
    e.event,
    e.deviceId,
    e.platform,
    String(e.timestamp),
    new Date(e.timestamp).toISOString(),
    JSON.stringify(e.props ?? {}),
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white border border-black/5 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#888]">{label}</p>
      <p className="text-3xl font-extrabold text-[#1a1a1a] mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-xs text-[#999] mt-1">{hint}</p>}
    </div>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 truncate text-[#333]">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-black/5 overflow-hidden">
        <div className="h-full bg-key-orange rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-semibold text-[#333] tabular-nums">{count}</span>
    </div>
  );
}

function PasscodeGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (!PASSCODE) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#f4f3ef] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-black/5 p-6 text-center">
          <AlertTriangle className="mx-auto text-amber-dim mb-3" size={28} />
          <h1 className="font-extrabold text-lg text-[#1a1a1a] mb-2">Admin dashboard disabled</h1>
          <p className="text-sm text-[#666]">
            Set <code className="bg-black/5 px-1 rounded">VITE_ADMIN_PASSCODE</code> at build time to enable this
            page. It stays disabled by default so it's never accidentally left open.
          </p>
        </div>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSCODE) {
      try {
        sessionStorage.setItem(UNLOCK_KEY, '1');
      } catch {
        /* ignore */
      }
      onUnlock();
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#f4f3ef] px-4">
      <form onSubmit={submit} className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-black/5 p-6">
        <Lock className="text-[#444] mb-3" size={24} />
        <h1 className="font-extrabold text-lg text-[#1a1a1a] mb-1">Stanz Calc Admin</h1>
        <p className="text-sm text-[#666] mb-4">Enter the admin passcode to view usage analytics.</p>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          placeholder="Passcode"
          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${error ? 'border-red-400' : 'border-black/10'}`}
        />
        {error && <p className="text-xs text-red-500 mt-2">Incorrect passcode.</p>}
        <button type="submit" className="w-full mt-4 rounded-xl bg-key-orange text-white font-bold py-2.5">
          Unlock
        </button>
      </form>
    </div>
  );
}

function DashboardBody() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [asOf, setAsOf] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const remote = isRemoteConfigured();

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    setAsOf(Date.now());
    if (remote) {
      fetchRemoteEvents()
        .then(setEvents)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load remote events'))
        .finally(() => setLoading(false));
    } else {
      setEvents(getLocalLog());
      setLoading(false);
    }
  }, [remote]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const now = asOf;
    return {
      uniqueDevices: uniqueDeviceCount(events),
      activeToday: activeDevicesSince(events, now - DAY_MS),
      active7d: activeDevicesSince(events, now - 7 * DAY_MS),
      active30d: activeDevicesSince(events, now - 30 * DAY_MS),
      platforms: platformBreakdown(events),
      features: featurePopularity(events),
      pairs: topCurrencyPairs(events),
      apkClicks: events.filter((e) => e.event === 'apk_download_clicked').length,
      firstInstallsApk: new Set(
        events.filter((e) => e.event === 'app_first_install' && e.platform === 'android-apk').map((e) => e.deviceId),
      ).size,
    };
  }, [events, asOf]);

  const maxPlatform = Math.max(1, ...stats.platforms.map((p) => p.count));
  const maxFeature = Math.max(1, ...stats.features.map((f) => f.count));
  const maxPair = Math.max(1, ...stats.pairs.map((p) => p.count));

  const exportCsv = () => {
    const blob = new Blob([toCsv(events)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stanz-calc-events-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLocal = () => {
    if (remote) return;
    clearLocalLog();
    load();
  };

  return (
    <div className="min-h-[100dvh] bg-[#f4f3ef] px-4 py-6 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-extrabold text-xl text-[#1a1a1a]">Stanz Calc — Usage Analytics</h1>
            <p className="text-sm text-[#777]">
              {remote ? 'Reading from the configured Supabase app_events table.' : 'Local device log only — no backend configured.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-1.5 rounded-xl bg-white border border-black/10 px-3 py-2 text-sm font-semibold text-[#333]">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-xl bg-key-orange text-white px-3 py-2 text-sm font-semibold">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {!remote && (
          <div className="mb-6 rounded-xl bg-amber-dim/10 border border-amber-dim/30 px-4 py-3 text-sm text-[#664b00] flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              No <code className="bg-black/5 px-1 rounded">VITE_SUPABASE_URL</code> / <code className="bg-black/5 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> configured,
              so this shows only events recorded on <strong>this device/browser</strong>. Configure Supabase to see
              aggregate stats across every device. See the README for setup and the security caveats of a client-only
              analytics backend.
            </span>
          </div>
        )}

        {error && <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <p className="text-sm text-[#777]">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard label="Unique devices" value={stats.uniqueDevices} />
              <StatCard label="Active today" value={stats.activeToday} />
              <StatCard label="Active 7 days" value={stats.active7d} />
              <StatCard label="Active 30 days" value={stats.active30d} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl bg-white border border-black/5 p-4 shadow-sm">
                <h2 className="font-bold text-sm text-[#333] mb-3">Platform breakdown</h2>
                {stats.platforms.length === 0 && <p className="text-xs text-[#999]">No data yet.</p>}
                <div className="space-y-2">
                  {stats.platforms.map((p) => (
                    <BarRow key={p.platform} label={PLATFORM_LABEL[p.platform]} count={p.count} max={maxPlatform} />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-black/5 p-4 shadow-sm">
                <h2 className="font-bold text-sm text-[#333] mb-3">Download funnel</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#555]">Site visits (unique devices)</span><span className="font-bold tabular-nums">{stats.uniqueDevices}</span></div>
                  <div className="flex justify-between"><span className="text-[#555]">APK download clicks</span><span className="font-bold tabular-nums">{stats.apkClicks}</span></div>
                  <div className="flex justify-between"><span className="text-[#555]">First app launches (Android)</span><span className="font-bold tabular-nums">{stats.firstInstallsApk}</span></div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl bg-white border border-black/5 p-4 shadow-sm">
                <h2 className="font-bold text-sm text-[#333] mb-3">Feature popularity</h2>
                {stats.features.length === 0 && <p className="text-xs text-[#999]">No feature_used events yet.</p>}
                <div className="space-y-2">
                  {stats.features.map((f) => (
                    <BarRow key={f.feature} label={f.feature} count={f.count} max={maxFeature} />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-black/5 p-4 shadow-sm">
                <h2 className="font-bold text-sm text-[#333] mb-3">Top converted currency pairs</h2>
                {stats.pairs.length === 0 && <p className="text-xs text-[#999]">No currency conversions recorded yet.</p>}
                <div className="space-y-2">
                  {stats.pairs.map((p) => (
                    <BarRow key={p.pair} label={p.pair} count={p.count} max={maxPair} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#999]">
              <span>{events.length} raw events loaded.</span>
              {!remote && (
                <button onClick={handleClearLocal} className="flex items-center gap-1 text-red-500 hover:text-red-700">
                  <Trash2 size={12} /> Clear local log
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(UNLOCK_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (!unlocked) return <PasscodeGate onUnlock={() => setUnlocked(true)} />;
  return <DashboardBody />;
}
