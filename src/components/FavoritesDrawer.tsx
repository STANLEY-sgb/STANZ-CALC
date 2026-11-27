import { useEffect, useState } from 'react';
import { X, Star, Trash2, Plus } from 'lucide-react';
import { findCurrency } from '../engine/currencyService';
import type { CalculatorApi } from '../hooks/useCalculator';
import type { useCurrencyConverter } from '../hooks/useCurrencyConverter';

type CurrencyApi = ReturnType<typeof useCurrencyConverter>;

interface SavedFormula {
  id: string;
  name: string;
  expression: string;
}

const FORMULAS_KEY = 'stanzcalc.savedFormulas.v1';

const PHYSICAL_CONSTANTS = [
  { label: 'Speed of light c', value: '299792458', unit: 'm/s' },
  { label: "Planck's constant h", value: '6.62607015e-34', unit: 'J·s' },
  { label: 'Gravitational G', value: '6.6743e-11', unit: 'm³/kg·s²' },
  { label: "Avogadro's number", value: '6.02214076e23', unit: '/mol' },
  { label: 'Boltzmann constant k', value: '1.380649e-23', unit: 'J/K' },
  { label: 'Elementary charge e', value: '1.602176634e-19', unit: 'C' },
];

function loadFormulas(): SavedFormula[] {
  try {
    const raw = localStorage.getItem(FORMULAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface FavoritesDrawerProps {
  onClose: () => void;
  calc: CalculatorApi;
  currency: CurrencyApi;
  onSwitchToCurrency: () => void;
}

export function FavoritesDrawer({ onClose, calc, currency, onSwitchToCurrency }: FavoritesDrawerProps) {
  const [formulas, setFormulas] = useState<SavedFormula[]>(() => loadFormulas());

  useEffect(() => {
    try {
      localStorage.setItem(FORMULAS_KEY, JSON.stringify(formulas));
    } catch {
      /* ignore quota errors */
    }
  }, [formulas]);

  const saveCurrentFormula = () => {
    if (!calc.expression.trim()) return;
    const name = window.prompt('Name this formula', calc.expression.slice(0, 20));
    if (!name) return;
    setFormulas((prev) => [{ id: `${Date.now()}`, name, expression: calc.expression }, ...prev].slice(0, 30));
  };

  const removeFormula = (id: string) => setFormulas((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-chassis-top rounded-t-[28px] sm:rounded-[28px] max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-chassis-top flex items-center justify-between px-5 py-4 border-b border-black/10">
          <h2 className="font-extrabold text-lg text-[#222] flex items-center gap-2">
            <Star size={18} className="text-badge-green" fill="currentColor" /> Favorites
          </h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-black/5">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <section>
            <p className="text-xs font-bold uppercase tracking-wide text-[#888] mb-2">Pinned currency pairs</p>
            {currency.favorites.length === 0 && <p className="text-sm text-[#777]">No pinned pairs yet.</p>}
            <div className="flex flex-col gap-2">
              {currency.favorites.map((key) => {
                const [from, to] = key.split('-');
                const fromMeta = findCurrency(from);
                const toMeta = findCurrency(to);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      currency.setFrom(from);
                      currency.setTo(to);
                      onSwitchToCurrency();
                      onClose();
                    }}
                    className="flex items-center justify-between rounded-xl bg-black/5 px-4 py-3 text-sm font-semibold text-[#333]"
                  >
                    <span>
                      {fromMeta?.flag} {from} → {toMeta?.flag} {to}
                    </span>
                    <Trash2
                      size={15}
                      className="text-[#999]"
                      onClick={(e) => {
                        e.stopPropagation();
                        currency.toggleFavorite(from, to);
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#888]">Saved formulas</p>
              <button onClick={saveCurrentFormula} className="text-badge-blue flex items-center gap-1 text-xs font-bold">
                <Plus size={14} /> Save current
              </button>
            </div>
            {formulas.length === 0 && <p className="text-sm text-[#777]">No saved formulas yet.</p>}
            <div className="flex flex-col gap-2">
              {formulas.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    calc.insertFromHistory(f.expression);
                    onClose();
                  }}
                  className="flex items-center justify-between rounded-xl bg-black/5 px-4 py-3 text-left"
                >
                  <span>
                    <span className="block text-sm font-bold text-[#333]">{f.name}</span>
                    <span className="block text-xs text-[#777] tabular-display">{f.expression}</span>
                  </span>
                  <Trash2
                    size={15}
                    className="text-[#999] shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFormula(f.id);
                    }}
                  />
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-wide text-[#888] mb-2">Physical constants</p>
            <div className="flex flex-col gap-2">
              {PHYSICAL_CONSTANTS.map((c) => (
                <button
                  key={c.label}
                  onClick={() => {
                    calc.insertFromHistory(c.value);
                    onClose();
                  }}
                  className="flex items-center justify-between rounded-xl bg-black/5 px-4 py-3 text-sm"
                >
                  <span className="font-semibold text-[#333]">{c.label}</span>
                  <span className="tabular-display text-xs text-[#777]">{c.value} {c.unit}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
