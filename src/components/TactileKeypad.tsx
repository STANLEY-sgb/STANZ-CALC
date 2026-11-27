import { useCallback, useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { Star, Menu, Delete } from 'lucide-react';
import { playKeyFeedback } from '../utils/soundAndHaptics';

export interface KeypadInput {
  inputDigit: (d: string) => void;
  inputDecimal: () => void;
  inputOperator: (op: string) => void;
  inputParen: (paren: '(' | ')') => void;
  inputPostfix: (symbol: '!' | '%') => void;
  toggleSign: () => void;
  backspace: () => void;
  clearEntry: () => void;
  allClear: () => void;
  equals: () => void;
}

interface TactileKeypadProps {
  input: KeypadInput;
  onOpenFavorites: () => void;
  onOpenMenu: () => void;
}

const LONG_PRESS_MS = 450;
const DOUBLE_TAP_MS = 320;

export function Keycap({
  onClick,
  className = '',
  bg,
  children,
  ariaLabel,
  rowSpan,
  feedback = 'default',
}: {
  onClick: () => void;
  className?: string;
  bg: string;
  children: ReactNode;
  ariaLabel: string;
  rowSpan?: number;
  feedback?: 'default' | 'accent' | 'danger';
}) {
  const handle = useCallback(() => {
    playKeyFeedback(feedback);
    onClick();
  }, [onClick, feedback]);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={handle}
      style={rowSpan ? { gridRow: `span ${rowSpan}` } : undefined}
      className={[
        'relative rounded-[14px] no-select active:translate-y-[2px] transition-transform duration-75',
        'flex items-center justify-center font-bold text-lg',
        'shadow-[0_4px_6px_rgba(0,0,0,0.28)] active:shadow-[0_1px_2px_rgba(0,0,0,0.3)]',
        'before:content-[""] before:absolute before:inset-0 before:rounded-[14px]',
        'before:bg-gradient-to-b before:from-white/40 before:to-transparent before:opacity-60 before:pointer-events-none',
        bg,
        className,
      ].join(' ')}
    >
      <span className="relative z-10">{children}</span>
      <span
        className="absolute w-[24%] h-[24%] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 35% 32%, rgba(255,255,255,0.35), rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.14) 100%)',
        }}
      />
    </button>
  );
}

export function TactileKeypad({ input, onOpenFavorites, onOpenMenu }: TactileKeypadProps) {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef(0);
  const longPressedRef = useRef(false);

  const handleCeDown = useCallback(() => {
    longPressedRef.current = false;
    pressTimer.current = setTimeout(() => {
      longPressedRef.current = true;
      playKeyFeedback('danger');
      input.allClear();
    }, LONG_PRESS_MS);
  }, [input]);

  const handleCeUp = useCallback(() => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (longPressedRef.current) return;
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      playKeyFeedback('danger');
      input.allClear();
      lastTapRef.current = 0;
    } else {
      playKeyFeedback('danger');
      input.clearEntry();
      lastTapRef.current = now;
    }
  }, [input]);

  // Any other key press between two CE taps should cancel the double-tap window,
  // so pressing CE, typing, then pressing CE again never gets misread as "all clear".
  const handleOtherKeyActivity = useCallback((e: ReactPointerEvent) => {
    if (!(e.target as HTMLElement).closest('[data-ce-button]')) {
      lastTapRef.current = 0;
    }
  }, []);

  return (
    <div className="grid grid-cols-5 gap-[7px] p-3" onPointerDownCapture={handleOtherKeyActivity}>
      {/* Row 1 */}
      <button
        type="button"
        data-ce-button="true"
        aria-label="Clear entry (hold or double-tap for all clear)"
        onPointerDown={handleCeDown}
        onPointerUp={handleCeUp}
        onPointerLeave={() => pressTimer.current && clearTimeout(pressTimer.current)}
        className="relative rounded-[14px] bg-key-ivory no-select active:translate-y-[2px] shadow-[0_4px_6px_rgba(0,0,0,0.28)] flex items-center justify-center"
      >
        <span className="w-9 h-9 rounded-full bg-badge-red flex items-center justify-center text-white text-xs font-extrabold">CE</span>
      </button>
      <Keycap bg="bg-key-ivory" onClick={onOpenFavorites} ariaLabel="Favorites and quick convert" feedback="accent">
        <span className="w-9 h-9 rounded-full bg-badge-green flex items-center justify-center text-white">
          <Star size={16} fill="white" />
        </span>
      </Keycap>
      <Keycap bg="bg-key-ivory" onClick={onOpenMenu} ariaLabel="Mode and app menu" feedback="accent">
        <span className="w-9 h-9 rounded-full bg-badge-blue flex items-center justify-center text-white">
          <Menu size={16} strokeWidth={3} />
        </span>
      </Keycap>
      <Keycap bg="bg-key-orange text-white" onClick={() => input.inputParen('(')} ariaLabel="Open parenthesis">
        (
      </Keycap>
      <Keycap bg="bg-key-orange text-white" onClick={() => input.inputParen(')')} ariaLabel="Close parenthesis">
        )
      </Keycap>

      {/* Row 2 */}
      <Keycap bg="bg-key-slate text-white" onClick={() => input.inputDigit('7')} ariaLabel="7">7</Keycap>
      <Keycap bg="bg-key-slate text-white" onClick={() => input.inputDigit('8')} ariaLabel="8">8</Keycap>
      <Keycap bg="bg-key-slate text-white" onClick={() => input.inputDigit('9')} ariaLabel="9">9</Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A]" onClick={() => input.inputOperator('/')} ariaLabel="Divide">÷</Keycap>
      <Keycap bg="bg-key-orange text-white" onClick={input.backspace} ariaLabel="Backspace">
        <Delete size={20} />
      </Keycap>

      {/* Row 3 */}
      <Keycap bg="bg-key-slate text-white" onClick={() => input.inputDigit('4')} ariaLabel="4">4</Keycap>
      <Keycap bg="bg-key-slate text-white" onClick={() => input.inputDigit('5')} ariaLabel="5">5</Keycap>
      <Keycap bg="bg-key-slate text-white" onClick={() => input.inputDigit('6')} ariaLabel="6">6</Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A]" onClick={() => input.inputOperator('*')} ariaLabel="Multiply">×</Keycap>
      <Keycap bg="bg-key-orange text-white" onClick={() => input.inputPostfix('%')} ariaLabel="Percent">%</Keycap>

      {/* Row 4 */}
      <Keycap bg="bg-key-slate text-white" onClick={() => input.inputDigit('1')} ariaLabel="1">1</Keycap>
      <Keycap bg="bg-key-slate text-white" onClick={() => input.inputDigit('2')} ariaLabel="2">2</Keycap>
      <Keycap bg="bg-key-slate text-white" onClick={() => input.inputDigit('3')} ariaLabel="3">3</Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A]" onClick={() => input.inputOperator('-')} ariaLabel="Subtract">-</Keycap>
      <Keycap
        bg="bg-key-cream text-[#1A1A1A] text-2xl"
        onClick={input.equals}
        ariaLabel="Equals"
        rowSpan={2}
        feedback="accent"
      >
        =
      </Keycap>

      {/* Row 5 */}
      <Keycap bg="bg-key-slate text-white" onClick={input.toggleSign} ariaLabel="Toggle sign">+/-</Keycap>
      <Keycap bg="bg-key-slate text-white" onClick={() => input.inputDigit('0')} ariaLabel="0">0</Keycap>
      <Keycap bg="bg-key-slate text-white" onClick={input.inputDecimal} ariaLabel="Decimal point">.</Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A]" onClick={() => input.inputOperator('+')} ariaLabel="Add">+</Keycap>
    </div>
  );
}
