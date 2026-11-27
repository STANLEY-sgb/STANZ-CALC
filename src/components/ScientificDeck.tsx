import { useState } from 'react';
import { Keycap } from './TactileKeypad';
import type { CalculatorApi } from '../hooks/useCalculator';

interface ScientificDeckProps {
  calc: CalculatorApi;
}

export function ScientificDeck({ calc }: ScientificDeckProps) {
  const [shift, setShift] = useState(false);

  const fn = (snippet: string) => () => calc.inputFunction(snippet);
  const op = (token: string) => () => calc.inputOperator(token);
  const paren = (token: '(' | ')') => () => calc.inputParen(token);
  const postfixBang = () => calc.inputPostfix('!');

  return (
    <div className="grid grid-cols-5 gap-[7px] px-3 pb-3">
      {/* Row 1 — shift / angle mode / primary trig (toggles to inverse trig) */}
      <Keycap
        bg={shift ? 'bg-badge-blue text-white' : 'bg-key-cream text-[#1A1A1A]'}
        onClick={() => setShift((s) => !s)}
        ariaLabel="Second function shift"
        className="text-sm"
      >
        2nd
      </Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-xs" onClick={calc.cycleAngleMode} ariaLabel="Cycle angle unit">
        {calc.angleMode}
      </Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={fn(shift ? 'asin(' : 'sin(')} ariaLabel="Sine">
        {shift ? 'sin⁻¹' : 'sin'}
      </Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={fn(shift ? 'acos(' : 'cos(')} ariaLabel="Cosine">
        {shift ? 'cos⁻¹' : 'cos'}
      </Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={fn(shift ? 'atan(' : 'tan(')} ariaLabel="Tangent">
        {shift ? 'tan⁻¹' : 'tan'}
      </Keycap>

      {/* Row 2 — hyperbolics + constants */}
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={fn('sinh(')} ariaLabel="Hyperbolic sine">sinh</Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={fn('cosh(')} ariaLabel="Hyperbolic cosine">cosh</Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={fn('tanh(')} ariaLabel="Hyperbolic tangent">tanh</Keycap>
      <Keycap bg="bg-key-slate text-white text-sm" onClick={fn('π')} ariaLabel="Pi">π</Keycap>
      <Keycap bg="bg-key-slate text-white text-sm" onClick={fn('e')} ariaLabel="Euler's number">e</Keycap>

      {/* Row 3 — powers and roots (shift swaps x²/x³ for √/∛) */}
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={shift ? fn('sqrt(') : fn('^2')} ariaLabel="Square or square root">
        {shift ? '√x' : 'x²'}
      </Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={shift ? fn('cbrt(') : fn('^3')} ariaLabel="Cube or cube root">
        {shift ? '∛x' : 'x³'}
      </Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={op('^')} ariaLabel="Power">xʸ</Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={fn('root(')} ariaLabel="Nth root">ʸ√x</Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={fn('1/(')} ariaLabel="Reciprocal">1/x</Keycap>

      {/* Row 4 — logs / exponentials (shift swaps ln/log for eˣ/10ˣ) */}
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={shift ? fn('exp(') : fn('ln(')} ariaLabel="Natural log or e to the x">
        {shift ? 'eˣ' : 'ln'}
      </Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={shift ? fn('10^') : fn('log(')} ariaLabel="Log base 10 or 10 to the x">
        {shift ? '10ˣ' : 'log₁₀'}
      </Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={fn('logy(')} ariaLabel="Log base y of x">log_y(x)</Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={postfixBang} ariaLabel="Factorial">n!</Keycap>
      <Keycap bg="bg-key-cream text-[#1A1A1A] text-sm" onClick={fn('abs(')} ariaLabel="Absolute value">|x|</Keycap>

      {/* Row 5 — combinatorics / utility */}
      <Keycap bg="bg-key-slate text-white text-sm" onClick={fn('nPr(')} ariaLabel="Permutations">nPr</Keycap>
      <Keycap bg="bg-key-slate text-white text-sm" onClick={fn('nCr(')} ariaLabel="Combinations">nCr</Keycap>
      <Keycap bg="bg-key-slate text-white text-sm" onClick={fn('mod(')} ariaLabel="Modulo">mod</Keycap>
      <Keycap bg="bg-key-slate text-white text-sm" onClick={() => calc.inputDigit('e')} ariaLabel="Scientific exponent entry">EE</Keycap>
      <Keycap bg="bg-key-slate text-white text-sm" onClick={fn('rand')} ariaLabel="Random number">RAND</Keycap>

      {/* Row 6 — phi / Ans / grouping / comma */}
      <Keycap bg="bg-key-slate text-white text-sm" onClick={fn('φ')} ariaLabel="Golden ratio">φ</Keycap>
      <Keycap bg="bg-key-slate text-white text-sm" onClick={fn('Ans')} ariaLabel="Last answer">Ans</Keycap>
      <Keycap bg="bg-key-orange text-white text-sm" onClick={paren('(')} ariaLabel="Open parenthesis">(</Keycap>
      <Keycap bg="bg-key-orange text-white text-sm" onClick={paren(')')} ariaLabel="Close parenthesis">)</Keycap>
      <Keycap bg="bg-key-orange text-white text-sm" onClick={fn(',')} ariaLabel="Argument separator">,</Keycap>

      {/* Row 7 — memory registers */}
      <Keycap bg="bg-badge-blue text-white text-sm" onClick={calc.memoryClear} ariaLabel="Memory clear">MC</Keycap>
      <Keycap bg="bg-badge-blue text-white text-sm" onClick={calc.memoryRecall} ariaLabel="Memory recall">MR</Keycap>
      <Keycap bg="bg-badge-blue text-white text-sm" onClick={calc.memoryAdd} ariaLabel="Memory add">M+</Keycap>
      <Keycap bg="bg-badge-blue text-white text-sm" onClick={calc.memorySubtract} ariaLabel="Memory subtract">M-</Keycap>
      <Keycap bg="bg-badge-blue text-white text-sm" onClick={calc.memoryStore} ariaLabel="Memory store">MS</Keycap>
    </div>
  );
}
