import { useEffect, useRef, type RefObject } from 'react';
import { Maximize2, Minimize2, ArrowDownUp, Star } from 'lucide-react';
import type { CalculatorApi } from '../hooks/useCalculator';
import { findCurrency } from '../engine/currencyService';
import { formatCurrencyAmount } from '../utils/format';
import { playKeyFeedback } from '../utils/soundAndHaptics';
import { trackFeatureUsed } from '../utils/analytics';

type CurrencyApi = ReturnType<typeof import('../hooks/useCurrencyConverter').useCurrencyConverter>;

interface OledDisplayProps {
  screenMode: 'calc' | 'currency';
  deckExpanded: boolean;
  onToggleExpand: () => void;
  calc: CalculatorApi;
  currency: CurrencyApi;
  onOpenCurrencyPicker: (which: 'from' | 'to') => void;
}

export function OledDisplay({
  screenMode,
  deckExpanded,
  onToggleExpand,
  calc,
  currency,
  onOpenCurrencyPicker,
}: OledDisplayProps) {
  const tapeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tapeRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [calc.history.length]);

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
      <div className="flex justify-end gap-2 px-3 pt-2 pb-1 text-[10px] tracking-widest tabular-display">
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
            <span className="tabular-display text-sm text-amber/90 truncate">
              {h.expression} = {h.result}
            </span>
          </button>
        ))}
      </div>

      <div className="px-3 pb-4 pt-2">
        <div className="text-right tabular-display text-amber-dim text-[20px] h-7 truncate">
          {calc.errorFlash ?? calc.livePreview}
        </div>
        <div
          className="text-right tabular-display font-bold text-amber truncate"
          style={{ fontSize: calc.expression.length > 14 ? '28px' : calc.expression.length > 9 ? '36px' : '46px' }}
        >
          {calc.expression || '0'}
        </div>
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
        <div className="tabular-display text-amber text-3xl font-bold truncate max-w-[60%]">
          {currency.amountExpr}
        </div>
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
        <div className="tabular-display text-amber text-3xl font-bold truncate max-w-[60%]">
          {isFinite(currency.convertedValue) ? formatCurrencyAmount(currency.convertedValue) : '—'}
        </div>
      </div>
    </div>
  );
}
