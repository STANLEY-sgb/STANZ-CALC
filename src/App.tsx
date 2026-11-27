import { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { OledDisplay } from './components/OledDisplay';
import { TactileKeypad, type KeypadInput } from './components/TactileKeypad';
import { ScientificDeck } from './components/ScientificDeck';
import { MenuDrawer } from './components/MenuDrawer';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { CurrencyPicker } from './components/CurrencyPicker';
import { DownloadHubModal } from './components/DownloadHubModal';
import { IosInstallBanner } from './components/IosInstallBanner';
import { useCalculator } from './hooks/useCalculator';
import { useCurrencyConverter } from './hooks/useCurrencyConverter';
import { isSoundEnabled, setSoundEnabled } from './utils/soundAndHaptics';
import { trackAppLaunch, trackFeatureUsed } from './utils/analytics';

type Drawer = 'menu' | 'favorites' | 'download' | null;

function App() {
  const calc = useCalculator();
  const currency = useCurrencyConverter();

  const [deckExpanded, setDeckExpanded] = useState(false);
  const [screenMode, setScreenMode] = useState<'calc' | 'currency'>('calc');
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [currencyPickerFor, setCurrencyPickerFor] = useState<'from' | 'to' | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState(() => isSoundEnabled());

  const calcAdapter: KeypadInput = {
    inputDigit: calc.inputDigit,
    inputDecimal: calc.inputDecimal,
    inputOperator: calc.inputOperator,
    inputParen: calc.inputParen,
    inputPostfix: calc.inputPostfix,
    toggleSign: calc.toggleSign,
    backspace: calc.backspace,
    clearEntry: calc.clearEntry,
    allClear: calc.allClear,
    equals: calc.equals,
  };

  const currencyAdapter: KeypadInput = {
    inputDigit: (d) => currency.setAmountExpr((prev) => prev === '0' ? d : prev + d),
    inputDecimal: () =>
      currency.setAmountExpr((prev) => {
        const tail = prev.split(/[+\-*/^()]/).pop() ?? '';
        return tail.includes('.') ? prev : prev + '.';
      }),
    inputOperator: (op) =>
      currency.setAmountExpr((prev) => {
        if (!prev) return op === '-' ? op : prev;
        const last = prev[prev.length - 1];
        if ('+-*/^'.includes(last)) return prev.slice(0, -1) + op;
        return prev + op;
      }),
    inputParen: (p) => currency.setAmountExpr((prev) => prev + p),
    inputPostfix: (p) => currency.setAmountExpr((prev) => prev + p),
    toggleSign: () =>
      currency.setAmountExpr((prev) => (prev.startsWith('-') ? prev.slice(1) : `-${prev}`)),
    backspace: () => currency.setAmountExpr((prev) => prev.slice(0, -1) || '0'),
    clearEntry: () => currency.setAmountExpr('0'),
    allClear: () => currency.setAmountExpr('0'),
    equals: () => currency.setAmountExpr(String(currency.amountValue || 0)),
  };

  const activeInput = screenMode === 'calc' ? calcAdapter : currencyAdapter;

  useEffect(() => {
    trackAppLaunch();
  }, []);

  const setDeckExpandedTracked = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    setDeckExpanded((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      if (value && !prev) trackFeatureUsed('scientific_mode');
      return value;
    });
  }, []);

  const setScreenModeTracked = useCallback((next: 'calc' | 'currency') => {
    setScreenMode((prev) => {
      if (next === 'currency' && prev !== 'currency') {
        trackFeatureUsed('currency_convert', { from: currency.from, to: currency.to });
      }
      return next;
    });
  }, [currency.from, currency.to]);

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      const input = activeInput;

      if (/^[0-9]$/.test(e.key)) return input.inputDigit(e.key);
      if (e.key === '.') return input.inputDecimal();
      if (e.key === '+') return input.inputOperator('+');
      if (e.key === '-') return input.inputOperator('-');
      if (e.key === '*') return input.inputOperator('*');
      if (e.key === '/') { e.preventDefault(); return input.inputOperator('/'); }
      if (e.key === '^') return input.inputOperator('^');
      if (e.key === '%') return input.inputPostfix('%');
      if (e.key === '(') return input.inputParen('(');
      if (e.key === ')') return input.inputParen(')');
      if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); return input.equals(); }
      if (e.key === 'Backspace') return input.backspace();
      if (e.key === 'Escape') return input.clearEntry();
      if (screenMode === 'calc') {
        if (e.key === 's') return calc.inputFunction('sin(');
        if (e.key === 'c') return calc.inputFunction('cos(');
        if (e.key === 't') return calc.inputFunction('tan(');
        if (e.key === 'l') return calc.inputFunction('ln(');
        if (e.key === 'p') return calc.inputFunction('π');
      }
    };
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  });

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      setSoundEnabled(!prev);
      return !prev;
    });
  }, []);

  const openCurrencyPicker = useCallback((which: 'from' | 'to') => setCurrencyPickerFor(which), []);

  return (
    <div className="min-h-[100dvh] bg-desk flex flex-col items-center justify-center py-6 px-4" style={{
      paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
      paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
    }}>
      {/* Desktop studio bar */}
      <div className="hidden sm:flex w-full max-w-3xl justify-between items-center mb-4 text-[#777] text-xs tracking-wide">
        <span>STANZ CALC // stanz-apps.online</span>
        <button
          onClick={() => setDrawer('download')}
          className="flex items-center gap-1.5 text-[#555] hover:text-[#222] font-semibold"
        >
          <Download size={13} /> Get App
        </button>
      </div>

      <div
        className="relative w-full transition-[max-width] duration-300 ease-out no-select"
        style={{ maxWidth: deckExpanded ? 760 : 430 }}
      >
        <div
          className="rounded-[38px] p-4 sm:p-5 shadow-[0_30px_60px_rgba(0,0,0,0.25)]"
          style={{ background: 'linear-gradient(to bottom, var(--color-chassis-top), var(--color-chassis-bottom))' }}
        >
          <OledDisplay
            screenMode={screenMode}
            deckExpanded={deckExpanded}
            onToggleExpand={() => setDeckExpandedTracked((v) => !v)}
            calc={calc}
            currency={currency}
            onOpenCurrencyPicker={openCurrencyPicker}
          />

          <div className={deckExpanded ? 'grid sm:grid-cols-2 gap-2' : ''}>
            <TactileKeypad
              input={activeInput}
              onOpenFavorites={() => setDrawer('favorites')}
              onOpenMenu={() => setDrawer('menu')}
            />
            {deckExpanded && <ScientificDeck calc={calc} />}
          </div>

          <div className="text-center text-[9px] tracking-[0.2em] text-[#999] pt-2 pb-1 select-none">
            STANZ CALC // stanz-apps.online
          </div>
        </div>
      </div>

      <IosInstallBanner />

      {drawer === 'menu' && (
        <MenuDrawer
          onClose={() => setDrawer(null)}
          screenMode={screenMode}
          onSetScreenMode={setScreenModeTracked}
          deckExpanded={deckExpanded}
          onSetDeckExpanded={setDeckExpandedTracked}
          angleMode={calc.angleMode}
          onSetAngleMode={calc.setAngleMode}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onOpenDownloadHub={() => setDrawer('download')}
        />
      )}
      {drawer === 'favorites' && (
        <FavoritesDrawer
          onClose={() => setDrawer(null)}
          calc={calc}
          currency={currency}
          onSwitchToCurrency={() => setScreenModeTracked('currency')}
        />
      )}
      {drawer === 'download' && <DownloadHubModal onClose={() => setDrawer(null)} />}
      {currencyPickerFor && (
        <CurrencyPicker
          activeCode={currencyPickerFor === 'from' ? currency.from : currency.to}
          onClose={() => setCurrencyPickerFor(null)}
          onSelect={(code) => {
            if (currencyPickerFor === 'from') currency.setFrom(code);
            else currency.setTo(code);
            setCurrencyPickerFor(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
