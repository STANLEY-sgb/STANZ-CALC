import { useState } from 'react';
import { X, Download, Smartphone, Apple, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { trackApkDownloadClicked } from '../utils/analytics';

const SITE_URL = 'https://stanz-apps.online';
const APK_URL = `${SITE_URL}/downloads/stanz-calc.apk`;

interface DownloadHubModalProps {
  onClose: () => void;
}

export function DownloadHubModal({ onClose }: DownloadHubModalProps) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'android' | 'ios'>('android');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — user can still select the text manually */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-chassis-top rounded-t-[28px] sm:rounded-[28px] max-h-[88vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-chassis-top flex items-center justify-between px-5 py-4 border-b border-black/10">
          <h2 className="font-extrabold text-lg text-[#222]">Get Stanz Calc</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-black/5">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 px-5 pt-4">
          <button
            onClick={() => setTab('android')}
            className={`flex-1 rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-2 ${tab === 'android' ? 'bg-key-orange text-white' : 'bg-black/5 text-[#444]'}`}
          >
            <Smartphone size={16} /> Android
          </button>
          <button
            onClick={() => setTab('ios')}
            className={`flex-1 rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-2 ${tab === 'ios' ? 'bg-key-orange text-white' : 'bg-black/5 text-[#444]'}`}
          >
            <Apple size={16} /> iPhone / iPad
          </button>
        </div>

        <div className="p-5 space-y-4">
          {tab === 'android' ? (
            <>
              <a
                href={APK_URL}
                download
                onClick={trackApkDownloadClicked}
                className="flex items-center justify-center gap-2 bg-badge-green text-white font-bold rounded-2xl py-4 shadow-lg active:scale-[0.98] transition-transform"
              >
                <Download size={18} /> Download Android APK
              </a>
              <ol className="text-sm text-[#444] space-y-2 list-decimal list-inside">
                <li>Tap the download button above to fetch <code className="bg-black/5 px-1 rounded">stanz-calc.apk</code>.</li>
                <li>If prompted, tap <strong>Settings</strong> and allow installs from this browser.</li>
                <li>Open the downloaded file and tap <strong>Install</strong>.</li>
              </ol>
            </>
          ) : (
            <>
              <div className="rounded-2xl bg-black/5 p-4 text-sm text-[#444] space-y-2">
                <p className="font-bold text-[#222]">Install directly from Safari — no App Store needed:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open <strong>{SITE_URL}</strong> in Safari on your iPhone or iPad.</li>
                  <li>
                    Tap the <strong>Share</strong> icon (⍐) in the toolbar.
                  </li>
                  <li>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </li>
                  <li>Launch Stanz Calc from your Home Screen — it runs full-screen, offline.</li>
                </ol>
                <p className="text-xs text-[#777] pt-1">
                  Prefer a sideloaded native build? The CI pipeline also publishes an unsigned <code>.ipa</code> for AltStore / SideStore.
                </p>
              </div>
            </>
          )}

          <div className="rounded-2xl bg-white p-4 flex items-center gap-4">
            <QRCodeSVG value={SITE_URL} size={88} bgColor="#ffffff" fgColor="#050505" level="M" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#555] mb-1">Scan to open on any phone, then install from the link.</p>
              <div className="flex items-center gap-2">
                <code className="text-xs truncate bg-black/5 rounded px-2 py-1 flex-1">{SITE_URL}</code>
                <button
                  onClick={copyLink}
                  aria-label="Copy link"
                  className="p-2 rounded-lg bg-key-orange text-white shrink-0"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
