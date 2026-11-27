import { useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal, evaluateExpression } from '../engine/mathParser';
import {
  CURRENCIES,
  getRates,
  convertAmount,
  type RateSnapshot,
} from '../engine/currencyService';

const PREF_KEY = 'stanzcalc.currencyPrefs.v1';

export const QUICK_PICK_CODES = ['USD', 'UGX', 'EUR', 'GBP', 'KES', 'JPY', 'AED', 'ZAR', 'CAD', 'CNY', 'INR'];

interface Prefs {
  from: string;
  to: string;
  favorites: string[];
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.from === 'string' && typeof parsed.to === 'string') {
        return { from: parsed.from, to: parsed.to, favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [] };
      }
    }
  } catch {
    /* ignore */
  }
  return { from: 'USD', to: 'UGX', favorites: ['USD-UGX', 'USD-EUR', 'USD-GBP'] };
}

export function useCurrencyConverter() {
  const [amountExpr, setAmountExpr] = useState('0');
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [rates, setRates] = useState<RateSnapshot | null>(null);
  const [status, setStatus] = useState<'loading' | 'live' | 'cached' | 'offline'>('loading');

  useEffect(() => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore quota errors */
    }
  }, [prefs]);

  const refresh = useCallback(async (force = false) => {
    setStatus('loading');
    const snapshot = await getRates(force);
    setRates(snapshot);
    setStatus(snapshot.source === 'live-primary' || snapshot.source === 'live-fallback' ? 'live' : snapshot.source === 'cached' ? 'cached' : 'offline');
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => refresh(true);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refresh]);

  const amountValue = useMemo(() => {
    try {
      const value = evaluateExpression(amountExpr, { angleMode: 'DEG', ans: new Decimal(0), memory: new Decimal(0) });
      return value.toNumber();
    } catch {
      return NaN;
    }
  }, [amountExpr]);

  const convertedValue = useMemo(() => {
    if (!rates || !isFinite(amountValue)) return NaN;
    return convertAmount(amountValue, prefs.from, prefs.to, rates.rates);
  }, [rates, amountValue, prefs.from, prefs.to]);

  const rateLine = useMemo(() => {
    if (!rates) return NaN;
    return convertAmount(1, prefs.from, prefs.to, rates.rates);
  }, [rates, prefs.from, prefs.to]);

  const setFrom = useCallback((code: string) => setPrefs((p) => ({ ...p, from: code })), []);
  const setTo = useCallback((code: string) => setPrefs((p) => ({ ...p, to: code })), []);
  const swap = useCallback(() => setPrefs((p) => ({ ...p, from: p.to, to: p.from })), []);

  const toggleFavorite = useCallback((from: string, to: string) => {
    const key = `${from}-${to}`;
    setPrefs((p) => {
      const exists = p.favorites.includes(key);
      return { ...p, favorites: exists ? p.favorites.filter((f) => f !== key) : [key, ...p.favorites].slice(0, 20) };
    });
  }, []);

  return {
    amountExpr,
    setAmountExpr,
    amountValue,
    convertedValue,
    rateLine,
    from: prefs.from,
    to: prefs.to,
    setFrom,
    setTo,
    swap,
    favorites: prefs.favorites,
    toggleFavorite,
    status,
    lastUpdated: rates?.fetchedAt ?? null,
    refresh,
    currencies: CURRENCIES,
  };
}
