import { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';
import { trackIosInstallPromptShown } from '../utils/analytics';

const DISMISS_KEY = 'stanzcalc.iosBannerDismissed.v1';

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isAppleTouch = /iPad|iPhone|iPod/.test(ua);
  const isIpadOs13 = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isAppleTouch || isIpadOs13;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function IosInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (!isIos()) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    const timer = setTimeout(() => {
      setVisible(true);
      trackIosInstallPromptShown();
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore quota errors */
    }
  };

  return (
    <div className="fixed left-3 right-3 z-50 flex items-center gap-3 rounded-2xl bg-[#1a1a1a] text-white px-4 py-3 shadow-2xl" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
      <div className="w-9 h-9 rounded-xl bg-key-orange flex items-center justify-center shrink-0">
        <Share size={16} />
      </div>
      <p className="text-xs leading-snug flex-1">
        Install Stanz Calc: tap <strong>Share</strong> then <strong>Add to Home Screen</strong> for a full-screen, offline app.
      </p>
      <button onClick={dismiss} aria-label="Dismiss" className="p-1 shrink-0 opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}
