import Decimal from 'decimal.js';

Decimal.set({ precision: 48, rounding: Decimal.ROUND_HALF_UP, toExpPos: 1e9, toExpNeg: -1e9 });

export type AngleMode = 'DEG' | 'RAD' | 'GRAD';

export class MathError extends Error {}

export interface EvalContext {
  angleMode: AngleMode;
  ans: Decimal;
  memory: Decimal;
}

type TokenType =
  | 'NUMBER'
  | 'IDENT'
  | 'OP'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'BANG'
  | 'PERCENT'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

const FUNCTIONS_1ARG = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
  'sqrt', 'cbrt', 'ln', 'log', 'log2', 'exp', 'abs',
]);

const FUNCTIONS_2ARG = new Set(['logy', 'npr', 'ncr', 'mod', 'root', 'atan2']);

function isDigit(ch: string) {
  return ch >= '0' && ch <= '9';
}

function isIdentStart(ch: string) {
  return /[a-zA-Zπφ]/.test(ch);
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = input.replace(/\s+/g, '');
  while (i < s.length) {
    const ch = s[i];
    const start = i;

    if (isDigit(ch) || (ch === '.' && isDigit(s[i + 1] ?? ''))) {
      let j = i;
      while (j < s.length && isDigit(s[j])) j++;
      if (s[j] === '.') {
        j++;
        while (j < s.length && isDigit(s[j])) j++;
      }
      if ((s[j] === 'e' || s[j] === 'E') && (isDigit(s[j + 1] ?? '') || ((s[j + 1] === '+' || s[j + 1] === '-') && isDigit(s[j + 2] ?? '')))) {
        j++;
        if (s[j] === '+' || s[j] === '-') j++;
        while (j < s.length && isDigit(s[j])) j++;
      }
      tokens.push({ type: 'NUMBER', value: s.slice(i, j), pos: start });
      i = j;
      continue;
    }

    if (ch === 'π') {
      tokens.push({ type: 'IDENT', value: 'pi', pos: start });
      i++;
      continue;
    }
    if (ch === 'φ') {
      tokens.push({ type: 'IDENT', value: 'phi', pos: start });
      i++;
      continue;
    }

    if (isIdentStart(ch)) {
      let j = i + 1;
      while (j < s.length && /[a-zA-Z0-9]/.test(s[j])) j++;
      let name = s.slice(i, j).toLowerCase();
      // Inverse-trig shorthand produced by the UI: sin⁻¹( etc.
      if (s.slice(j, j + 2) === '⁻¹') {
        name = 'a' + name;
        j += 2;
      }
      tokens.push({ type: 'IDENT', value: name, pos: start });
      i = j;
      continue;
    }

    if (ch === '(') { tokens.push({ type: 'LPAREN', value: ch, pos: start }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'RPAREN', value: ch, pos: start }); i++; continue; }
    if (ch === ',') { tokens.push({ type: 'COMMA', value: ch, pos: start }); i++; continue; }
    if (ch === '!') { tokens.push({ type: 'BANG', value: ch, pos: start }); i++; continue; }
    if (ch === '%') { tokens.push({ type: 'PERCENT', value: ch, pos: start }); i++; continue; }
    if ('+-×x*÷/^'.includes(ch)) {
      const op = ch === '×' || ch === 'x' ? '*' : ch === '÷' ? '/' : ch;
      tokens.push({ type: 'OP', value: op, pos: start });
      i++;
      continue;
    }

    throw new MathError('Syntax Error');
  }
  tokens.push({ type: 'EOF', value: '', pos: s.length });
  return tokens;
}

function autoCloseParens(tokens: Token[]): Token[] {
  let depth = 0;
  for (const t of tokens) {
    if (t.type === 'LPAREN') depth++;
    if (t.type === 'RPAREN') depth--;
  }
  if (depth <= 0) return tokens;
  const eof = tokens[tokens.length - 1];
  const closers: Token[] = [];
  for (let k = 0; k < depth; k++) closers.push({ type: 'RPAREN', value: ')', pos: eof.pos });
  return [...tokens.slice(0, -1), ...closers, eof];
}

function toRadians(value: Decimal, mode: AngleMode): Decimal {
  if (mode === 'DEG') return value.mul(Decimal.acos(-1)).div(180);
  if (mode === 'GRAD') return value.mul(Decimal.acos(-1)).div(200);
  return value;
}

function fromRadians(value: Decimal, mode: AngleMode): Decimal {
  if (mode === 'DEG') return value.mul(180).div(Decimal.acos(-1));
  if (mode === 'GRAD') return value.mul(200).div(Decimal.acos(-1));
  return value;
}

function factorialDecimal(n: Decimal): Decimal {
  if (!n.isInteger() || n.isNegative()) throw new MathError('Domain Error');
  if (n.gt(100000)) throw new MathError('Overflow');
  let result = new Decimal(1);
  let i = new Decimal(2);
  while (i.lte(n)) {
    result = result.mul(i);
    i = i.add(1);
  }
  return result;
}

const GAMMA_G = 7;
const GAMMA_COEFFS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

function gammaNumber(xIn: number): number {
  let x = xIn;
  if (x < 0.5) {
    return Math.PI / (Math.sin(Math.PI * x) * gammaNumber(1 - x));
  }
  x -= 1;
  let a = GAMMA_COEFFS[0];
  const t = x + GAMMA_G + 0.5;
  for (let i = 1; i < GAMMA_G + 2; i++) a += GAMMA_COEFFS[i] / (x + i);
  return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
}

function factorialGeneral(n: Decimal): Decimal {
  if (n.isInteger() && !n.isNegative()) return factorialDecimal(n);
  if (n.isInteger() && n.isNegative()) throw new MathError('Domain Error');
  const x = n.toNumber();
  const g = gammaNumber(x + 1);
  if (!isFinite(g)) throw new MathError('Overflow');
  return new Decimal(g);
}

// Carries a raw percent number up to the nearest + or - so "200 + 10%" can mean
// "200 + 10% of 200" (= 220), while every other context collapses it to value/100.
interface PValue {
  value: Decimal;
  isPercent: boolean;
}

function plainValue(value: Decimal): PValue {
  return { value, isPercent: false };
}

function collapsePercent(v: PValue): Decimal {
  return v.isPercent ? v.value.div(100) : v.value;
}

class Parser {
  private tokens: Token[];
  private pos = 0;
  private ctx: EvalContext;
  constructor(tokens: Token[], ctx: EvalContext) {
    this.tokens = tokens;
    this.ctx = ctx;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private next(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType): Token {
    const t = this.next();
    if (t.type !== type) throw new MathError('Syntax Error');
    return t;
  }

  parseProgram(): Decimal {
    if (this.peek().type === 'EOF') throw new MathError('Error');
    const value = collapsePercent(this.parseExpression());
    if (this.peek().type !== 'EOF') throw new MathError('Syntax Error');
    return value;
  }

  // A bare "N%" carries its raw number up uncollapsed so + and - can apply the
  // "percent of the other operand" convention (200 + 10% = 220). Every other
  // context (*, /, ^, function args, parens) collapses it to N/100 immediately,
  // which also covers a standalone "50%" = 0.5.
  private parseExpression(): PValue {
    let value = collapsePercent(this.parseTerm());
    for (;;) {
      const t = this.peek();
      if (t.type === 'OP' && (t.value === '+' || t.value === '-')) {
        this.next();
        const rhs = this.parseTerm();
        const rhsDecimal = rhs.isPercent ? value.mul(rhs.value).div(100) : collapsePercent(rhs);
        value = t.value === '+' ? value.add(rhsDecimal) : value.sub(rhsDecimal);
      } else {
        break;
      }
    }
    return plainValue(value);
  }

  private startsFactor(): boolean {
    const t = this.peek();
    return t.type === 'NUMBER' || t.type === 'IDENT' || t.type === 'LPAREN';
  }

  private parseTerm(): PValue {
    let value = this.parseUnary();
    for (;;) {
      const t = this.peek();
      if (t.type === 'OP' && (t.value === '*' || t.value === '/')) {
        this.next();
        const lhs = collapsePercent(value);
        const rhs = collapsePercent(this.parseUnary());
        if (t.value === '*') {
          value = plainValue(lhs.mul(rhs));
        } else {
          if (rhs.isZero()) throw new MathError('Div by 0');
          value = plainValue(lhs.div(rhs));
        }
      } else if (this.startsFactor()) {
        // implicit multiplication: 2π, 3(4+5), (2+3)(4+5), 2sin(30)
        const lhs = collapsePercent(value);
        const rhs = collapsePercent(this.parseUnary());
        value = plainValue(lhs.mul(rhs));
      } else {
        break;
      }
    }
    return value;
  }

  private parseUnary(): PValue {
    const t = this.peek();
    if (t.type === 'OP' && t.value === '-') {
      this.next();
      return plainValue(collapsePercent(this.parseUnary()).neg());
    }
    if (t.type === 'OP' && t.value === '+') {
      this.next();
      return this.parseUnary();
    }
    return this.parsePower();
  }

  private parsePower(): PValue {
    const base = this.parsePostfix();
    const t = this.peek();
    if (t.type === 'OP' && t.value === '^') {
      this.next();
      const exponent = collapsePercent(this.parseUnary());
      return plainValue(powDecimal(collapsePercent(base), exponent));
    }
    return base;
  }

  private parsePostfix(): PValue {
    let value = this.parsePrimary();
    for (;;) {
      const t = this.peek();
      if (t.type === 'BANG') {
        this.next();
        value = plainValue(factorialGeneral(collapsePercent(value)));
      } else if (t.type === 'PERCENT') {
        this.next();
        value = { value: collapsePercent(value), isPercent: true };
      } else {
        break;
      }
    }
    return value;
  }

  private parseArgs(count: number): Decimal[] {
    this.expect('LPAREN');
    const args: Decimal[] = [];
    if (this.peek().type !== 'RPAREN') {
      args.push(collapsePercent(this.parseExpression()));
      while (this.peek().type === 'COMMA') {
        this.next();
        args.push(collapsePercent(this.parseExpression()));
      }
    }
    this.expect('RPAREN');
    if (args.length !== count) throw new MathError('Syntax Error');
    return args;
  }

  private parsePrimary(): PValue {
    const t = this.next();

    if (t.type === 'NUMBER') {
      return plainValue(new Decimal(t.value));
    }

    if (t.type === 'LPAREN') {
      const value = collapsePercent(this.parseExpression());
      this.expect('RPAREN');
      return plainValue(value);
    }

    if (t.type === 'IDENT') {
      const name = t.value;

      if (name === 'pi') return plainValue(Decimal.acos(-1));
      if (name === 'e') return plainValue(Decimal.exp(1));
      if (name === 'phi') return plainValue(Decimal.sqrt(5).add(1).div(2));
      if (name === 'ans') return plainValue(this.ctx.ans);
      if (name === 'rand') return plainValue(new Decimal(Math.random()));

      if (FUNCTIONS_1ARG.has(name)) {
        const [arg] = this.parseArgs(1);
        return plainValue(this.applyFn1(name, arg));
      }
      if (FUNCTIONS_2ARG.has(name)) {
        const [a, b] = this.parseArgs(2);
        return plainValue(this.applyFn2(name, a, b));
      }

      throw new MathError(`Unknown: ${name}`);
    }

    throw new MathError('Syntax Error');
  }

  private applyFn1(name: string, arg: Decimal): Decimal {
    switch (name) {
      case 'sin': return toRadians(arg, this.ctx.angleMode).sin();
      case 'cos': return toRadians(arg, this.ctx.angleMode).cos();
      case 'tan': return toRadians(arg, this.ctx.angleMode).tan();
      case 'asin':
        if (arg.abs().gt(1)) throw new MathError('Domain Error');
        return fromRadians(Decimal.asin(arg), this.ctx.angleMode);
      case 'acos':
        if (arg.abs().gt(1)) throw new MathError('Domain Error');
        return fromRadians(Decimal.acos(arg), this.ctx.angleMode);
      case 'atan':
        return fromRadians(Decimal.atan(arg), this.ctx.angleMode);
      case 'sinh': return arg.sinh();
      case 'cosh': return arg.cosh();
      case 'tanh': return arg.tanh();
      case 'asinh': return arg.asinh();
      case 'acosh':
        if (arg.lt(1)) throw new MathError('Domain Error');
        return arg.acosh();
      case 'atanh':
        if (arg.abs().gte(1)) throw new MathError('Domain Error');
        return arg.atanh();
      case 'sqrt':
        if (arg.isNegative()) throw new MathError('Domain Error');
        return arg.sqrt();
      case 'cbrt': return Decimal.cbrt(arg);
      case 'ln':
        if (arg.lte(0)) throw new MathError('Domain Error');
        return arg.ln();
      case 'log':
      case 'log10':
        if (arg.lte(0)) throw new MathError('Domain Error');
        return arg.log(10);
      case 'log2':
        if (arg.lte(0)) throw new MathError('Domain Error');
        return arg.log(2);
      case 'exp': return Decimal.exp(arg);
      case 'abs': return arg.abs();
      default:
        throw new MathError(`Unknown: ${name}`);
    }
  }

  private applyFn2(name: string, a: Decimal, b: Decimal): Decimal {
    switch (name) {
      case 'logy':
        if (a.lte(0) || b.lte(0) || b.eq(1)) throw new MathError('Domain Error');
        return a.log(b);
      case 'root':
        if (b.isZero()) throw new MathError('Domain Error');
        return powDecimal(a, new Decimal(1).div(b));
      case 'mod': {
        if (b.isZero()) throw new MathError('Div by 0');
        return a.sub(b.mul(a.div(b).floor()));
      }
      case 'npr': {
        if (!a.isInteger() || !b.isInteger() || a.isNegative() || b.isNegative() || b.gt(a)) throw new MathError('Domain Error');
        return factorialDecimal(a).div(factorialDecimal(a.sub(b)));
      }
      case 'ncr': {
        if (!a.isInteger() || !b.isInteger() || a.isNegative() || b.isNegative() || b.gt(a)) throw new MathError('Domain Error');
        return factorialDecimal(a).div(factorialDecimal(b).mul(factorialDecimal(a.sub(b))));
      }
      case 'atan2':
        return fromRadians(new Decimal(Math.atan2(a.toNumber(), b.toNumber())), this.ctx.angleMode);
      default:
        throw new MathError(`Unknown: ${name}`);
    }
  }
}

export function powDecimal(base: Decimal, exponent: Decimal): Decimal {
  if (base.isZero()) {
    if (exponent.isZero()) return new Decimal(1);
    if (exponent.isNegative()) throw new MathError('Div by 0');
    return new Decimal(0);
  }
  if (base.isNegative() && !exponent.isInteger()) {
    throw new MathError('Domain Error');
  }
  return base.pow(exponent);
}

export function evaluateExpression(expression: string, ctx: EvalContext): Decimal {
  if (!expression || !expression.trim()) throw new MathError('Error');
  const tokens = autoCloseParens(tokenize(expression));
  const parser = new Parser(tokens, ctx);
  const result = parser.parseProgram();
  if (!result.isFinite()) throw new MathError('Overflow');
  return result;
}

export { Decimal };
