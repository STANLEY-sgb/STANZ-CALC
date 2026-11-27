import type { ReactNode } from 'react';
import { X, Calculator, FlaskConical, DollarSign, Volume2, VolumeX, Download } from 'lucide-react';
import type { AngleMode } from '../engine/mathParser';

interface MenuDrawerProps {
  onClose: () => void;
  screenMode: 'calc' | 'currency';
  onSetScreenMode: (m: 'calc' | 'currency') => void;
  deckExpanded: boolean;
  onSetDeckExpanded: (v: boolean) => void;
  angleMode: AngleMode;
  onSetAngleMode: (m: AngleMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenDownloadHub: () => void;
}

export function MenuDrawer({
  onClose,
  screenMode,
  onSetScreenMode,
  deckExpanded,
  onSetDeckExpanded,
  angleMode,
  onSetAngleMode,
  soundEnabled,
  onToggleSound,
  onOpenDownloadHub,
}: MenuDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-chassis-top rounded-t-[28px] sm:rounded-[28px] max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-chassis-top flex items-center justify-between px-5 py-4 border-b border-black/10">
          <h2 className="font-extrabold text-lg text-[#222]">Menu</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-black/5">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <section>
            <p className="text-xs font-bold uppercase tracking-wide text-[#888] mb-2">Mode</p>
            <div className="grid grid-cols-1 gap-2">
              <MenuButton
                active={screenMode === 'calc' && !deckExpanded}
                icon={<Calculator size={18} />}
                label="Standard Calculator"
                onClick={() => {
                  onSetScreenMode('calc');
                  onSetDeckExpanded(false);
                  onClose();
                }}
              />
              <MenuButton
                active={screenMode === 'calc' && deckExpanded}
                icon={<FlaskConical size={18} />}
                label="Scientific Mode"
                onClick={() => {
                  onSetScreenMode('calc');
                  onSetDeckExpanded(true);
                  onClose();
                }}
              />
              <MenuButton
                active={screenMode === 'currency'}
                icon={<DollarSign size={18} />}
                label="Currency Converter"
                onClick={() => {
                  onSetScreenMode('currency');
                  onClose();
                }}
              />
            </div>
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-wide text-[#888] mb-2">Angle Unit</p>
            <div className="flex gap-2">
              {(['DEG', 'RAD', 'GRAD'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onSetAngleMode(m)}
                  className={`flex-1 rounded-xl py-2 text-sm font-bold ${angleMode === m ? 'bg-key-orange text-white' : 'bg-black/5 text-[#444]'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-wide text-[#888] mb-2">Sound</p>
            <MenuButton
              active={soundEnabled}
              icon={soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              label={soundEnabled ? 'Key clicks: On' : 'Key clicks: Off'}
              onClick={onToggleSound}
            />
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-wide text-[#888] mb-2">Get the app</p>
            <MenuButton
              icon={<Download size={18} />}
              label="Download APK / iOS Link Install"
              onClick={onOpenDownloadHub}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function MenuButton({
  active,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-left ${active ? 'bg-key-orange text-white' : 'bg-black/5 text-[#333]'}`}
    >
      {icon}
      {label}
    </button>
  );
}
