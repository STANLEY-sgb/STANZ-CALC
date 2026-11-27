import { useEffect, useRef, type RefObject } from 'react';
import { Maximize2, Minimize2, ArrowDownUp, Star, Menu } from 'lucide-react';
import type { CalculatorApi } from '../hooks/useCalculator';
import { findCurrency } from '../engine/currencyService';
import { formatCurrencyAmount } from '../utils/format';
import { playKeyFeedback } from '../utils/soundAndHaptics';
import { trackFeatureUsed } from '../utils/analytics';
import { AutoFitText } from './AutoFitText';
import { ScanScreen } from './ScanScreen';

type CurrencyApi = ReturnType<typeof import('../hooks/useCurrencyConverter').useCurrencyConverter>;

interface OledDisplayProps {
  screenMode: 'calc' | 'currency' | 'scan';
  deckExpanded: boolean;
  onToggleExpand: () => void;
  calc: CalculatorApi;
  currency: CurrencyApi;
  onOpenCurrencyPicker: (which: 'from' | 'to') => void;
  onOpenMenu: () => void;
  onCloseScan: () => void;
}

export function OledDisplay({
  screenMode,
  deckExpanded,
  onToggleExpand,
  calc,
  currency,
  onOpenCurrencyPicker,
  onOpenMenu,
  onCloseScan,
}: OledDisplayProps) {
  const tapeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tapeRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [calc.history.length]);

  if (screenMode === 'scan') {
    return (
      <div className="relative rounded-[22px] bg-screen shadow-[inset_0_3px_10px_rgba(0,0,0,0.9)] overflow-hidden select-none">
        <ScanScreen calc={calc} onClose={onCloseScan} onInsert={(result) => { calc.insertFromHistory(result); onCloseScan(); }} />
      </div>
    );
  }

  return (
    <div className="relative rounded-[22px] bg-screen shadow-[inset_0_3px_10px_rgba(0,0,0,0.9)] overflow-hidden select-none">
      {/* Expand/collapse notch */}
      <button
        onClick={onToggleExpand}
        aria-label={deckExpanded ? 'Collapse scientific deck' : 'Expand scientific deck'}
        className="absolute top-0 left-0 z-20 w-9 h-9 rounded-br-[16px] rounded-tl-[22px] bg-[#DCDAD2] flex items-center justify-center active:translate-y-px shadow-sm"
      >
        {deckExpanded ? (
          <Minimize2 size={15} className="text-[#333]" strokeWidth={2.5} />
        ) : (
          <Maximize2 size={15} className="text-[#333]" strokeWidth={2.5} />
        )}
      </button>

      {/* Status strip */}
      <div className="flex items-center justify-end gap-2 px-3 pt-2 pb-1 text-[10px] tracking-widest tabular-display">
        {screenMode === 'calc' ? (
          <>
            {(['DEG', 'RAD', 'GRAD'] as const).map((m) => (
              <span key={m} className={m === calc.angleMode ? 'text-amber' : 'text-amber/25'}>
                {m}
              </span>
            ))}
            <span className={calc.hasMemory ? 'text-amber' : 'text-amber/25'}>M</span>
          </>
        ) : (
          <span className="text-amber-dim">
            {currency.status === 'live' ? 'FX LIVE' : currency.status === 'cached' ? 'FX CACHED' : currency.status === 'loading' ? 'FX …' : 'FX OFFLINE'}
          </span>
        )}
        <button
          onClick={onOpenMenu}
          aria-label="Mode and app menu"
          className="w-5 h-5 rounded-full border border-amber/50 flex items-center justify-center text-amber/80 ml-1"
        >
          <Menu size={10} strokeWidth={2.5} />
        </button>
      </div>

      {screenMode === 'calc' ? (
        <CalcScreen calc={calc} tapeRef={tapeRef} />
      ) : (
        <CurrencyScreen currency={currency} onOpenCurrencyPicker={onOpenCurrencyPicker} />
      )}
    </div>
  );
}

function CalcScreen({ calc, tapeRef }: { calc: CalculatorApi; tapeRef: RefObject<HTMLDivElement | null> }) {
  return (
    <>
      <div ref={tapeRef} className="h-[22vh] min-h-[120px] max-h-[220px] overflow-y-auto px-3 flex flex-col-reverse gap-0">
        {calc.history.length === 0 && (
          <div className="text-amber/20 text-xs py-2 text-right tabular-display">No history yet</div>
        )}
        {calc.history.map((h) => (
          <button
            key={h.id}
            onClick={() => {
              trackFeatureUsed('tape_history_reused');
              calc.insertFromHistory(h.result);
            }}
            className="relative flex items-center justify-end gap-2 py-2 border-b border-amber-hairline text-right active:bg-white/5"
          >
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-amber rounded-full" />
            <AutoFitText
              text={`${h.expression} = ${h.result}`}
              maxFontSize={14}
              minFontSize={9}
              className="flex-1 min-w-0 text-right"
              fontClassName="tabular-display text-amber/90"
            />
          </button>
        ))}
      </div>

      <div className="px-3 pb-4 pt-2">
        <div className="h-7 flex items-end justify-end">
          <AutoFitText
            text={calc.errorFlash ?? calc.livePreview}
            maxFontSize={20}
            minFontSize={11}
            className="text-right"
            fontClassName="tabular-display text-amber-dim"
          />
        </div>
        <AutoFitText
          text={calc.expression || '0'}
          maxFontSize={46}
          minFontSize={16}
          className="text-right"
          fontClassName="tabular-display font-bold text-amber"
        />
      </div>
    </>
  );
}

function CurrencyScreen({
  currency,
  onOpenCurrencyPicker,
}: {
  currency: CurrencyApi;
  onOpenCurrencyPicker: (which: 'from' | 'to') => void;
}) {
  const fromMeta = findCurrency(currency.from);
  const toMeta = findCurrency(currency.to);
  const isPinned = currency.favorites.includes(`${currency.from}-${currency.to}`);

  return (
    <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onOpenCurrencyPicker('from')}
          className="flex items-center gap-2 text-amber-dim text-sm active:opacity-70"
        >
          <span className="text-lg">{fromMeta?.flag}</span>
          <span className="font-bold tabular-display">{currency.from}</span>
        </button>
        <AutoFitText
          text={currency.amountExpr}
          maxFontSize={30}
          minFontSize={14}
          className="max-w-[60%] text-right"
          fontClassName="tabular-display text-amber font-bold"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            playKeyFeedback('accent');
            currency.swap();
          }}
          aria-label="Swap currencies"
          className="w-7 h-7 shrink-0 rounded-full bg-amber/15 flex items-center justify-center text-amber active:scale-90 transition-transform"
        >
          <ArrowDownUp size={14} />
        </button>
        <div className="flex-1 min-w-0 flex items-center justify-between text-[11px] text-amber/60 tabular-display">
          <span className="truncate">
            1 {currency.from} = {isFinite(currency.rateLine) ? currency.rateLine.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '—'} {currency.to}
          </span>
          {currency.lastUpdated && (
            <span className="shrink-0 pl-2">{new Date(currency.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
        <button
          onClick={() => {
            playKeyFeedback('accent');
            currency.toggleFavorite(currency.from, currency.to);
          }}
          aria-label={isPinned ? 'Unpin this pair' : 'Pin this pair to favorites'}
          className="w-7 h-7 shrink-0 rounded-full bg-amber/15 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Star size={13} className={isPinned ? 'text-badge-green' : 'text-amber/50'} fill={isPinned ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="h-px bg-amber-hairline" />

      <div className="flex items-center justify-between">
        <button
          onClick={() => onOpenCurrencyPicker('to')}
          className="flex items-center gap-2 text-amber-dim text-sm active:opacity-70"
        >
          <span className="text-lg">{toMeta?.flag}</span>
          <span className="font-bold tabular-display">{currency.to}</span>
        </button>
        <AutoFitText
          text={isFinite(currency.convertedValue) ? formatCurrencyAmount(currency.convertedValue) : '—'}
          maxFontSize={30}
          minFontSize={14}
          className="max-w-[60%] text-right"
          fontClassName="tabular-display text-amber font-bold"
        />
      </div>
    </div>
  );
}
