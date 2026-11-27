import { Capacitor } from '@capacitor/core';

export type PlatformKind = 'android-apk' | 'ios-pwa' | 'ios-safari' | 'web-desktop';

export type AnalyticsEventName =
  | 'app_first_install'
  | 'app_session_start'
  | 'apk_download_clicked'
  | 'ios_install_prompt_shown'
  | 'ios_pwa_installed'
  | 'feature_used';

export interface AnalyticsEvent {
  id: string;
  event: AnalyticsEventName;
  deviceId: string;
  platform: PlatformKind;
  timestamp: number;
  props?: Record<string, unknown>;
}

const DEVICE_ID_KEY = 'stanzcalc.analytics.deviceId';
const INSTALLED_KEY = 'stanzcalc.analytics.installed';
const STANDALONE_KEY = 'stanzcalc.analytics.wasStandalone';
const LOCAL_LOG_KEY = 'stanzcalc.analytics.log.v1';
const MAX_LOCAL_EVENTS = 500;

const env = import.meta.env;
const POSTHOG_KEY = env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
const UMAMI_WEBSITE_ID = env.VITE_UMAMI_WEBSITE_ID;
const UMAMI_SRC = env.VITE_UMAMI_SRC || 'https://cloud.umami.is/script.js';
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_TABLE = env.VITE_SUPABASE_EVENTS_TABLE || 'app_events';

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = uuidv4();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return `ephemeral-${uuidv4()}`;
  }
}

function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Four buckets by design (matches the product's distribution channels):
 * a native iOS shell is only ever sideloaded for testing, never distributed,
 * so it's reported as ios-pwa rather than inventing a fifth category.
 */
export function detectPlatform(): PlatformKind {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() === 'ios' ? 'ios-pwa' : 'android-apk';
  }
  if (isIos()) return isStandaloneDisplay() ? 'ios-pwa' : 'ios-safari';
  return 'web-desktop';
}

function appendLocalLog(entry: AnalyticsEvent): void {
  try {
    const raw = localStorage.getItem(LOCAL_LOG_KEY);
    const log: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    log.push(entry);
    const trimmed = log.length > MAX_LOCAL_EVENTS ? log.slice(log.length - MAX_LOCAL_EVENTS) : log;
    localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    /* localStorage unavailable or full — telemetry is best-effort only */
  }
}

export function getLocalLog(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearLocalLog(): void {
  try {
    localStorage.removeItem(LOCAL_LOG_KEY);
  } catch {
    /* ignore */
  }
}

let posthogInit: Promise<typeof import('posthog-js').default> | null = null;

function getPosthog() {
  if (!POSTHOG_KEY) return null;
  if (!posthogInit) {
    posthogInit = import('posthog-js').then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, { api_host: POSTHOG_HOST, capture_pageview: false, autocapture: false });
      return posthog;
    });
  }
  return posthogInit;
}

let umamiLoaded = false;

function ensureUmamiScript(): void {
  if (umamiLoaded || !UMAMI_WEBSITE_ID) return;
  umamiLoaded = true;
  const script = document.createElement('script');
  script.defer = true;
  script.src = UMAMI_SRC;
  script.setAttribute('data-website-id', UMAMI_WEBSITE_ID);
  document.head.appendChild(script);
}

function sendToRemote(entry: AnalyticsEvent): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      id: entry.id,
      event: entry.event,
      device_id: entry.deviceId,
      platform: entry.platform,
      created_at: new Date(entry.timestamp).toISOString(),
      props: entry.props ?? {},
    }),
    keepalive: true,
  }).catch(() => {
    /* best-effort — offline or backend unreachable is not a user-facing error */
  });
}

export function isRemoteConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function fetchRemoteEvents(limit = 5000): Promise<AnalyticsEvent[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=*&order=created_at.desc&limit=${limit}`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
  const rows = (await res.json()) as Array<{
    id: string;
    event: AnalyticsEventName;
    device_id: string;
    platform: PlatformKind;
    created_at: string;
    props: Record<string, unknown> | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    event: r.event,
    deviceId: r.device_id,
    platform: r.platform,
    timestamp: new Date(r.created_at).getTime(),
    props: r.props ?? undefined,
  }));
}

export function track(event: AnalyticsEventName, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const deviceId = getDeviceId();
  const platform = detectPlatform();
  const entry: AnalyticsEvent = { id: uuidv4(), event, deviceId, platform, timestamp: Date.now(), props };

  appendLocalLog(entry);
  sendToRemote(entry);

  if (POSTHOG_KEY) {
    getPosthog()
      ?.then((posthog) => {
        posthog.identify(deviceId);
        posthog.capture(event, { ...props, platform });
      })
      .catch(() => {});
  }

  if (UMAMI_WEBSITE_ID) {
    ensureUmamiScript();
    const umami = (window as unknown as { umami?: { track: (e: string, p?: Record<string, unknown>) => void } }).umami;
    umami?.track(event, { ...props, platform });
  }
}

function checkStandaloneTransition(): void {
  try {
    const wasStandalone = localStorage.getItem(STANDALONE_KEY) === '1';
    const isStandaloneNow = isStandaloneDisplay();
    if (isStandaloneNow && !wasStandalone) {
      track('ios_pwa_installed');
    }
    localStorage.setItem(STANDALONE_KEY, isStandaloneNow ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/** Call once on app mount. Fires app_first_install (once ever) then app_session_start (every launch). */
export function trackAppLaunch(): void {
  let isFirstInstall = false;
  try {
    if (!localStorage.getItem(INSTALLED_KEY)) {
      localStorage.setItem(INSTALLED_KEY, '1');
      isFirstInstall = true;
    }
  } catch {
    /* ignore */
  }
  if (isFirstInstall) track('app_first_install');
  track('app_session_start', {
    screen: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
  });
  checkStandaloneTransition();
}

export function trackApkDownloadClicked(): void {
  track('apk_download_clicked');
}

export function trackIosInstallPromptShown(): void {
  track('ios_install_prompt_shown');
}

export function trackFeatureUsed(feature: string, props?: Record<string, unknown>): void {
  track('feature_used', { feature, ...props });
}
