import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Decimal, evaluateExpression, type AngleMode, MathError } from '../engine/mathParser';
import { formatResult, formatLivePreview } from '../utils/format';

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
}

const HISTORY_KEY = 'stanzcalc.history.v1';
const MEMORY_KEY = 'stanzcalc.memory.v1';
const ANGLE_KEY = 'stanzcalc.angleMode.v1';
const MAX_HISTORY = 60;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadMemory(): Decimal {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? new Decimal(raw) : new Decimal(0);
  } catch {
    return new Decimal(0);
  }
}

function loadAngleMode(): AngleMode {
  const raw = localStorage.getItem(ANGLE_KEY);
  return raw === 'RAD' || raw === 'GRAD' ? raw : 'DEG';
}

const OPERATORS = new Set(['+', '-', '*', '/', '^']);
const DISPLAY_OPS: Record<string, string> = { '*': '×', '/': '÷' };

function lastSignificantChar(expr: string): string {
  return expr.length ? expr[expr.length - 1] : '';
}

/** Splits the trailing numeric run off an expression so unary sign-toggle / backspace can act on it. */
function findTrailingNumber(expr: string): { prefix: string; number: string } {
  let i = expr.length;
  while (i > 0 && /[0-9.]/.test(expr[i - 1])) i--;
  // include a leading unary minus directly preceding the number if it's not a binary operator
  if (i > 0 && expr[i - 1] === '-' && (i === 1 || OPERATORS.has(expr[i - 2]) || expr[i - 2] === '(')) {
    i--;
  }
  return { prefix: expr.slice(0, i), number: expr.slice(i) };
}

export function useCalculator() {
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [angleMode, setAngleMode] = useState<AngleMode>(() => loadAngleMode());
  const [errorFlash, setErrorFlash] = useState<string | null>(null);
  const [memory, setMemory] = useState<Decimal>(() => loadMemory());
  const [ans, setAns] = useState<Decimal>(() => new Decimal(0));
  // Internal-only flag read exclusively inside event handlers (never during render),
  // so a ref is the correct tool here — it doesn't need to trigger a re-render itself.
  const justEvaluatedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(ANGLE_KEY, angleMode);
  }, [angleMode]);

  const persistMemory = useCallback((value: Decimal) => {
    setMemory(value);
    try {
      localStorage.setItem(MEMORY_KEY, value.toString());
    } catch {
      /* ignore quota errors */
    }
  }, []);

  const ctx = useMemo(() => ({ angleMode, ans, memory }), [angleMode, ans, memory]);

  const livePreview = useMemo(() => {
    if (!expression.trim()) return '';
    try {
      const value = evaluateExpression(expression, ctx);
      return formatLivePreview(value);
    } catch {
      return '';
    }
  }, [expression, ctx]);

  const inputDigit = useCallback((digit: string) => {
    setErrorFlash(null);
    setExpression((prev) => {
      if (justEvaluatedRef.current) {
        justEvaluatedRef.current = false;
        return digit;
      }
      return prev + digit;
    });
  }, []);

  const inputDecimal = useCallback(() => {
    setErrorFlash(null);
    setExpression((prev) => {
      let base = prev;
      if (justEvaluatedRef.current) {
        justEvaluatedRef.current = false;
        base = '0';
      }
      const { number } = findTrailingNumber(base);
      if (number.includes('.')) return base;
      const needsLeadingZero = number === '' || number === '-';
      return base + (needsLeadingZero ? '0.' : '.');
    });
  }, []);

  const inputOperator = useCallback((op: string) => {
    setErrorFlash(null);
    setExpression((prev) => {
      let base = prev;
      if (justEvaluatedRef.current) {
        justEvaluatedRef.current = false;
        base = formatLivePreview(ans).replace(/,/g, '');
      }
      if (base === '' && op !== '-') return base;
      const last = lastSignificantChar(base);
      if (OPERATORS.has(last)) {
        if (op === '-' && last !== '-') return base + op;
        return base.slice(0, -1) + op;
      }
      return base + op;
    });
  }, [ans]);

  const inputFunction = useCallback((snippet: string) => {
    setErrorFlash(null);
    setExpression((prev) => {
      const base = justEvaluatedRef.current ? '' : prev;
      justEvaluatedRef.current = false;
      return base + snippet;
    });
  }, []);

  const inputParen = useCallback((paren: '(' | ')') => {
    setErrorFlash(null);
    setExpression((prev) => {
      let base = prev;
      if (justEvaluatedRef.current) {
        justEvaluatedRef.current = false;
        // Continue from the previous answer so "453" + "(" reads as 453*(...)
        base = paren === '(' ? formatLivePreview(ans).replace(/,/g, '') : prev;
      }
      return base + paren;
    });
  }, [ans]);

  const inputPostfix = useCallback((symbol: '!' | '%') => {
    setErrorFlash(null);
    setExpression((prev) => {
      if (!prev || justEvaluatedRef.current) return prev;
      const last = lastSignificantChar(prev);
      if (last === ')' || /[0-9]/.test(last)) return prev + symbol;
      return prev;
    });
  }, []);

  const toggleSign = useCallback(() => {
    setExpression((prev) => {
      if (justEvaluatedRef.current) {
        justEvaluatedRef.current = false;
        try {
          return formatLivePreview(ans.neg()).replace(/,/g, '');
        } catch {
          return prev;
        }
      }
      const { prefix, number } = findTrailingNumber(prev);
      if (!number) return prev + '-';
      if (number.startsWith('-')) return prefix + number.slice(1);
      return prefix + '-' + number;
    });
  }, [ans]);

  const backspace = useCallback(() => {
    setErrorFlash(null);
    justEvaluatedRef.current = false;
    setExpression((prev) => prev.slice(0, -1));
  }, []);

  const clearEntry = useCallback(() => {
    setErrorFlash(null);
    justEvaluatedRef.current = false;
    setExpression('');
  }, []);

  const allClear = useCallback(() => {
    setErrorFlash(null);
    justEvaluatedRef.current = false;
    setExpression('');
    setHistory([]);
    setAns(new Decimal(0));
    persistMemory(new Decimal(0));
  }, [persistMemory]);

  const clearTape = useCallback(() => setHistory([]), []);

  const equals = useCallback(() => {
    if (!expression.trim()) return;
    try {
      const value = evaluateExpression(expression, ctx);
      const resultStr = formatResult(value);
      setHistory((prev) => [{ id: `${Date.now()}-${Math.random()}`, expression, result: resultStr }, ...prev].slice(0, MAX_HISTORY));
      setAns(value);
      setExpression(resultStr.replace(/,/g, ''));
      justEvaluatedRef.current = true;
      setErrorFlash(null);
    } catch (err) {
      const message = err instanceof MathError ? err.message : 'Error';
      setErrorFlash(message);
    }
  }, [expression, ctx]);

  const insertFromHistory = useCallback((result: string) => {
    justEvaluatedRef.current = false;
    setErrorFlash(null);
    setExpression((prev) => prev + result.replace(/,/g, ''));
  }, []);

  const memoryClear = useCallback(() => persistMemory(new Decimal(0)), [persistMemory]);
  const memoryRecall = useCallback(() => {
    insertFromHistory(memory.toString());
  }, [insertFromHistory, memory]);
  const memoryAdd = useCallback(() => {
    try {
      const value = expression.trim() ? evaluateExpression(expression, ctx) : ans;
      persistMemory(memory.add(value));
    } catch {
      /* ignore invalid expression */
    }
  }, [expression, ctx, ans, memory, persistMemory]);
  const memorySubtract = useCallback(() => {
    try {
      const value = expression.trim() ? evaluateExpression(expression, ctx) : ans;
      persistMemory(memory.sub(value));
    } catch {
      /* ignore invalid expression */
    }
  }, [expression, ctx, ans, memory, persistMemory]);
  const memoryStore = useCallback(() => {
    try {
      const value = expression.trim() ? evaluateExpression(expression, ctx) : ans;
      persistMemory(value);
    } catch {
      /* ignore invalid expression */
    }
  }, [expression, ctx, ans, persistMemory]);

  const hasMemory = useMemo(() => !memory.isZero(), [memory]);

  const cycleAngleMode = useCallback(() => {
    setAngleMode((prev) => (prev === 'DEG' ? 'RAD' : prev === 'RAD' ? 'GRAD' : 'DEG'));
  }, []);

  return {
    expression,
    livePreview,
    history,
    errorFlash,
    angleMode,
    setAngleMode,
    cycleAngleMode,
    hasMemory,
    inputDigit,
    inputDecimal,
    inputOperator,
    inputFunction,
    inputParen,
    inputPostfix,
    toggleSign,
    backspace,
    clearEntry,
    allClear,
    clearTape,
    equals,
    insertFromHistory,
    memoryClear,
    memoryRecall,
    memoryAdd,
    memorySubtract,
    memoryStore,
  };
}

export type CalculatorApi = ReturnType<typeof useCalculator>;
export { DISPLAY_OPS };
