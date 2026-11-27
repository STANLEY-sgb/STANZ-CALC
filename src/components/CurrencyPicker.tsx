import { useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';
import { CURRENCIES } from '../engine/currencyService';
import { QUICK_PICK_CODES } from '../hooks/useCurrencyConverter';

interface CurrencyPickerProps {
  onClose: () => void;
  onSelect: (code: string) => void;
  activeCode: string;
}

export function CurrencyPicker({ onClose, onSelect, activeCode }: CurrencyPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-chassis-top rounded-t-[28px] sm:rounded-[28px] max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 shrink-0">
          <h2 className="font-extrabold text-lg text-[#222]">Choose currency</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-black/5">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-3 shrink-0">
          <div className="flex items-center gap-2 bg-black/5 rounded-xl px-3 py-2">
            <Search size={16} className="text-[#777]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 150+ currencies…"
              className="bg-transparent outline-none flex-1 text-sm text-[#222]"
            />
          </div>
          {!query && (
            <div className="flex flex-wrap gap-2 pt-3">
              {QUICK_PICK_CODES.map((code) => (
                <button
                  key={code}
                  onClick={() => onSelect(code)}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${code === activeCode ? 'bg-key-orange text-white' : 'bg-black/5 text-[#444]'}`}
                >
                  {code}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-y-auto px-2 pb-4 flex-1">
          {filtered.map((c) => (
            <button
              key={c.code}
              onClick={() => onSelect(c.code)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${c.code === activeCode ? 'bg-key-orange/10' : 'hover:bg-black/5'}`}
            >
              <span className="text-xl">{c.flag}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-[#222]">{c.code}</span>
                <span className="block text-xs text-[#777] truncate">{c.name}</span>
              </span>
              <span className="text-sm text-[#999]">{c.symbol}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center text-sm text-[#777] py-8">No currencies match.</p>}
        </div>
      </div>
    </div>
  );
}
