import { Decimal } from '../engine/mathParser';

const DISPLAY_SIG_DIGITS = 12;

export function formatResult(value: Decimal): string {
  if (value.isNaN()) return 'Error';
  if (!value.isFinite()) return value.isNegative() ? '-Infinity' : 'Infinity';

  const rounded = value.toSignificantDigits(DISPLAY_SIG_DIGITS);
  const absValue = rounded.abs();

  if (!absValue.isZero() && (absValue.gte('1e15') || absValue.lt('1e-6'))) {
    const exp = rounded.toExponential(8);
    return cleanExponential(exp);
  }

  const plain = rounded.toFixed();
  return groupThousands(plain);
}

function cleanExponential(exp: string): string {
  const [mantissaRaw, expPart] = exp.split('e');
  let mantissa = mantissaRaw;
  if (mantissa.includes('.')) {
    mantissa = mantissa.replace(/0+$/, '').replace(/\.$/, '');
  }
  const expNum = parseInt(expPart, 10);
  const sign = expNum >= 0 ? '+' : '-';
  return `${mantissa}e${sign}${Math.abs(expNum)}`;
}

export function groupThousands(numStr: string): string {
  const negative = numStr.startsWith('-');
  const unsigned = negative ? numStr.slice(1) : numStr;
  const [intPart, fracPart] = unsigned.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const result = fracPart !== undefined ? `${grouped}.${fracPart}` : grouped;
  return negative ? `-${result}` : result;
}

export function formatLivePreview(value: Decimal): string {
  try {
    return formatResult(value);
  } catch {
    return '';
  }
}

export function formatCurrencyAmount(value: number, maxDecimals = 2): string {
  if (!isFinite(value)) return '—';
  const fixed = value.toFixed(maxDecimals);
  return groupThousands(fixed);
}
