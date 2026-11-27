export interface CurrencyMeta {
  code: string;
  name: string;
  flag: string;
  symbol: string;
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥' },
  { code: 'UGX', name: 'Ugandan Shilling', flag: '🇺🇬', symbol: 'USh' },
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪', symbol: 'KSh' },
  { code: 'TZS', name: 'Tanzanian Shilling', flag: '🇹🇿', symbol: 'TSh' },
  { code: 'RWF', name: 'Rwandan Franc', flag: '🇷🇼', symbol: 'FRw' },
  { code: 'BIF', name: 'Burundian Franc', flag: '🇧🇮', symbol: 'FBu' },
  { code: 'ETB', name: 'Ethiopian Birr', flag: '🇪🇹', symbol: 'Br' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', flag: '🇬🇭', symbol: '₵' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', symbol: 'R' },
  { code: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬', symbol: 'E£' },
  { code: 'MAD', name: 'Moroccan Dirham', flag: '🇲🇦', symbol: 'MAD' },
  { code: 'DZD', name: 'Algerian Dinar', flag: '🇩🇿', symbol: 'DA' },
  { code: 'TND', name: 'Tunisian Dinar', flag: '🇹🇳', symbol: 'DT' },
  { code: 'XOF', name: 'West African CFA Franc', flag: '🌍', symbol: 'CFA' },
  { code: 'XAF', name: 'Central African CFA Franc', flag: '🌍', symbol: 'FCFA' },
  { code: 'ZMW', name: 'Zambian Kwacha', flag: '🇿🇲', symbol: 'ZK' },
  { code: 'MWK', name: 'Malawian Kwacha', flag: '🇲🇼', symbol: 'MK' },
  { code: 'MZN', name: 'Mozambican Metical', flag: '🇲🇿', symbol: 'MT' },
  { code: 'BWP', name: 'Botswana Pula', flag: '🇧🇼', symbol: 'P' },
  { code: 'NAD', name: 'Namibian Dollar', flag: '🇳🇦', symbol: 'N$' },
  { code: 'SZL', name: 'Eswatini Lilangeni', flag: '🇸🇿', symbol: 'L' },
  { code: 'LSL', name: 'Lesotho Loti', flag: '🇱🇸', symbol: 'L' },
  { code: 'AOA', name: 'Angolan Kwanza', flag: '🇦🇴', symbol: 'Kz' },
  { code: 'CDF', name: 'Congolese Franc', flag: '🇨🇩', symbol: 'FC' },
  { code: 'SDG', name: 'Sudanese Pound', flag: '🇸🇩', symbol: 'SDG' },
  { code: 'SSP', name: 'South Sudanese Pound', flag: '🇸🇸', symbol: 'SSP' },
  { code: 'SOS', name: 'Somali Shilling', flag: '🇸🇴', symbol: 'Sh' },
  { code: 'DJF', name: 'Djiboutian Franc', flag: '🇩🇯', symbol: 'Fdj' },
  { code: 'ERN', name: 'Eritrean Nakfa', flag: '🇪🇷', symbol: 'Nfk' },
  { code: 'LYD', name: 'Libyan Dinar', flag: '🇱🇾', symbol: 'LD' },
  { code: 'SLE', name: 'Sierra Leonean Leone', flag: '🇸🇱', symbol: 'Le' },
  { code: 'LRD', name: 'Liberian Dollar', flag: '🇱🇷', symbol: 'L$' },
  { code: 'GMD', name: 'Gambian Dalasi', flag: '🇬🇲', symbol: 'D' },
  { code: 'GNF', name: 'Guinean Franc', flag: '🇬🇳', symbol: 'FG' },
  { code: 'CVE', name: 'Cape Verdean Escudo', flag: '🇨🇻', symbol: 'Esc' },
  { code: 'STN', name: 'São Tomé and Príncipe Dobra', flag: '🇸🇹', symbol: 'Db' },
  { code: 'MGA', name: 'Malagasy Ariary', flag: '🇲🇬', symbol: 'Ar' },
  { code: 'MUR', name: 'Mauritian Rupee', flag: '🇲🇺', symbol: '₨' },
  { code: 'SCR', name: 'Seychellois Rupee', flag: '🇸🇨', symbol: '₨' },
  { code: 'KMF', name: 'Comorian Franc', flag: '🇰🇲', symbol: 'CF' },
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', symbol: '﷼' },
  { code: 'QAR', name: 'Qatari Riyal', flag: '🇶🇦', symbol: 'QR' },
  { code: 'KWD', name: 'Kuwaiti Dinar', flag: '🇰🇼', symbol: 'KD' },
  { code: 'BHD', name: 'Bahraini Dinar', flag: '🇧🇭', symbol: 'BD' },
  { code: 'OMR', name: 'Omani Rial', flag: '🇴🇲', symbol: 'OMR' },
  { code: 'JOD', name: 'Jordanian Dinar', flag: '🇯🇴', symbol: 'JD' },
  { code: 'ILS', name: 'Israeli New Shekel', flag: '🇮🇱', symbol: '₪' },
  { code: 'LBP', name: 'Lebanese Pound', flag: '🇱🇧', symbol: 'L£' },
  { code: 'IQD', name: 'Iraqi Dinar', flag: '🇮🇶', symbol: 'ID' },
  { code: 'IRR', name: 'Iranian Rial', flag: '🇮🇷', symbol: '﷼' },
  { code: 'YER', name: 'Yemeni Rial', flag: '🇾🇪', symbol: '﷼' },
  { code: 'TRY', name: 'Turkish Lira', flag: '🇹🇷', symbol: '₺' },
  { code: 'SYP', name: 'Syrian Pound', flag: '🇸🇾', symbol: 'S£' },
  { code: 'AFN', name: 'Afghan Afghani', flag: '🇦🇫', symbol: '؋' },
  { code: 'PKR', name: 'Pakistani Rupee', flag: '🇵🇰', symbol: '₨' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹' },
  { code: 'BDT', name: 'Bangladeshi Taka', flag: '🇧🇩', symbol: '৳' },
  { code: 'LKR', name: 'Sri Lankan Rupee', flag: '🇱🇰', symbol: '₨' },
  { code: 'NPR', name: 'Nepalese Rupee', flag: '🇳🇵', symbol: '₨' },
  { code: 'BTN', name: 'Bhutanese Ngultrum', flag: '🇧🇹', symbol: 'Nu.' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', flag: '🇲🇻', symbol: 'Rf' },
  { code: 'MMK', name: 'Myanmar Kyat', flag: '🇲🇲', symbol: 'K' },
  { code: 'THB', name: 'Thai Baht', flag: '🇹🇭', symbol: '฿' },
  { code: 'VND', name: 'Vietnamese Dong', flag: '🇻🇳', symbol: '₫' },
  { code: 'LAK', name: 'Lao Kip', flag: '🇱🇦', symbol: '₭' },
  { code: 'KHR', name: 'Cambodian Riel', flag: '🇰🇭', symbol: '៛' },
  { code: 'MYR', name: 'Malaysian Ringgit', flag: '🇲🇾', symbol: 'RM' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', symbol: 'S$' },
  { code: 'IDR', name: 'Indonesian Rupiah', flag: '🇮🇩', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', flag: '🇵🇭', symbol: '₱' },
  { code: 'BND', name: 'Brunei Dollar', flag: '🇧🇳', symbol: 'B$' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', symbol: '¥' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰', symbol: 'HK$' },
  { code: 'TWD', name: 'New Taiwan Dollar', flag: '🇹🇼', symbol: 'NT$' },
  { code: 'MOP', name: 'Macanese Pataca', flag: '🇲🇴', symbol: 'MOP$' },
  { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷', symbol: '₩' },
  { code: 'KPW', name: 'North Korean Won', flag: '🇰🇵', symbol: '₩' },
  { code: 'MNT', name: 'Mongolian Tugrik', flag: '🇲🇳', symbol: '₮' },
  { code: 'KZT', name: 'Kazakhstani Tenge', flag: '🇰🇿', symbol: '₸' },
  { code: 'UZS', name: 'Uzbekistani Som', flag: '🇺🇿', symbol: 'soʻm' },
  { code: 'TJS', name: 'Tajikistani Somoni', flag: '🇹🇯', symbol: 'SM' },
  { code: 'KGS', name: 'Kyrgystani Som', flag: '🇰🇬', symbol: 'с' },
  { code: 'TMT', name: 'Turkmenistani Manat', flag: '🇹🇲', symbol: 'm' },
  { code: 'AZN', name: 'Azerbaijani Manat', flag: '🇦🇿', symbol: '₼' },
  { code: 'GEL', name: 'Georgian Lari', flag: '🇬🇪', symbol: '₾' },
  { code: 'AMD', name: 'Armenian Dram', flag: '🇦🇲', symbol: '֏' },
  { code: 'RUB', name: 'Russian Ruble', flag: '🇷🇺', symbol: '₽' },
  { code: 'BYN', name: 'Belarusian Ruble', flag: '🇧🇾', symbol: 'Br' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', flag: '🇺🇦', symbol: '₴' },
  { code: 'MDL', name: 'Moldovan Leu', flag: '🇲🇩', symbol: 'L' },
  { code: 'RON', name: 'Romanian Leu', flag: '🇷🇴', symbol: 'lei' },
  { code: 'BGN', name: 'Bulgarian Lev', flag: '🇧🇬', symbol: 'лв' },
  { code: 'HUF', name: 'Hungarian Forint', flag: '🇭🇺', symbol: 'Ft' },
  { code: 'PLN', name: 'Polish Zloty', flag: '🇵🇱', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', flag: '🇨🇿', symbol: 'Kč' },
  { code: 'HRK', name: 'Croatian Kuna', flag: '🇭🇷', symbol: 'kn' },
  { code: 'RSD', name: 'Serbian Dinar', flag: '🇷🇸', symbol: 'din' },
  { code: 'ALL', name: 'Albanian Lek', flag: '🇦🇱', symbol: 'L' },
  { code: 'MKD', name: 'Macedonian Denar', flag: '🇲🇰', symbol: 'ден' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Mark', flag: '🇧🇦', symbol: 'KM' },
  { code: 'ISK', name: 'Icelandic Krona', flag: '🇮🇸', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', flag: '🇳🇴', symbol: 'kr' },
  { code: 'SEK', name: 'Swedish Krona', flag: '🇸🇪', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', flag: '🇩🇰', symbol: 'kr' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', symbol: 'CHF' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: 'C$' },
  { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽', symbol: 'MX$' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', flag: '🇬🇹', symbol: 'Q' },
  { code: 'HNL', name: 'Honduran Lempira', flag: '🇭🇳', symbol: 'L' },
  { code: 'NIO', name: 'Nicaraguan Cordoba', flag: '🇳🇮', symbol: 'C$' },
  { code: 'CRC', name: 'Costa Rican Colon', flag: '🇨🇷', symbol: '₡' },
  { code: 'PAB', name: 'Panamanian Balboa', flag: '🇵🇦', symbol: 'B/.' },
  { code: 'DOP', name: 'Dominican Peso', flag: '🇩🇴', symbol: 'RD$' },
  { code: 'JMD', name: 'Jamaican Dollar', flag: '🇯🇲', symbol: 'J$' },
  { code: 'TTD', name: 'Trinidad & Tobago Dollar', flag: '🇹🇹', symbol: 'TT$' },
  { code: 'BBD', name: 'Barbadian Dollar', flag: '🇧🇧', symbol: 'Bds$' },
  { code: 'BSD', name: 'Bahamian Dollar', flag: '🇧🇸', symbol: 'B$' },
  { code: 'BZD', name: 'Belize Dollar', flag: '🇧🇿', symbol: 'BZ$' },
  { code: 'KYD', name: 'Cayman Islands Dollar', flag: '🇰🇾', symbol: 'CI$' },
  { code: 'XCD', name: 'East Caribbean Dollar', flag: '🌴', symbol: 'EC$' },
  { code: 'HTG', name: 'Haitian Gourde', flag: '🇭🇹', symbol: 'G' },
  { code: 'CUP', name: 'Cuban Peso', flag: '🇨🇺', symbol: '$MN' },
  { code: 'AWG', name: 'Aruban Florin', flag: '🇦🇼', symbol: 'ƒ' },
  { code: 'ANG', name: 'Netherlands Antillean Guilder', flag: '🇨🇼', symbol: 'ƒ' },
  { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷', symbol: 'R$' },
  { code: 'ARS', name: 'Argentine Peso', flag: '🇦🇷', symbol: '$' },
  { code: 'CLP', name: 'Chilean Peso', flag: '🇨🇱', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', flag: '🇨🇴', symbol: 'Col$' },
  { code: 'PEN', name: 'Peruvian Sol', flag: '🇵🇪', symbol: 'S/' },
  { code: 'BOB', name: 'Bolivian Boliviano', flag: '🇧🇴', symbol: 'Bs' },
  { code: 'PYG', name: 'Paraguayan Guarani', flag: '🇵🇾', symbol: '₲' },
  { code: 'UYU', name: 'Uruguayan Peso', flag: '🇺🇾', symbol: '$U' },
  { code: 'VES', name: 'Venezuelan Bolivar', flag: '🇻🇪', symbol: 'Bs.' },
  { code: 'GYD', name: 'Guyanese Dollar', flag: '🇬🇾', symbol: 'G$' },
  { code: 'SRD', name: 'Surinamese Dollar', flag: '🇸🇷', symbol: 'Sr$' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: 'A$' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿', symbol: 'NZ$' },
  { code: 'FJD', name: 'Fijian Dollar', flag: '🇫🇯', symbol: 'FJ$' },
  { code: 'PGK', name: 'Papua New Guinean Kina', flag: '🇵🇬', symbol: 'K' },
  { code: 'SBD', name: 'Solomon Islands Dollar', flag: '🇸🇧', symbol: 'SI$' },
  { code: 'TOP', name: 'Tongan Paʻanga', flag: '🇹🇴', symbol: 'T$' },
  { code: 'WST', name: 'Samoan Tala', flag: '🇼🇸', symbol: 'WS$' },
  { code: 'VUV', name: 'Vanuatu Vatu', flag: '🇻🇺', symbol: 'VT' },
  { code: 'XPF', name: 'CFP Franc', flag: '🇵🇫', symbol: '₣' },
  { code: 'JEP', name: 'Jersey Pound', flag: '🇯🇪', symbol: '£' },
  { code: 'GIP', name: 'Gibraltar Pound', flag: '🇬🇮', symbol: '£' },
  { code: 'IMP', name: 'Isle of Man Pound', flag: '🇮🇲', symbol: '£' },
];

export interface RateSnapshot {
  base: 'USD';
  rates: Record<string, number>;
  fetchedAt: number;
  source: 'live-primary' | 'live-fallback' | 'cached' | 'baseline';
}

const CACHE_KEY = 'stanzcalc.fxRates.v1';
const PRIMARY_URL = 'https://open.er-api.com/v6/latest/USD';
const FALLBACK_URL = 'https://api.frankfurter.dev/v1/latest?from=USD';
const STALE_AFTER_MS = 1000 * 60 * 60 * 6;

// Baseline rates (approximate, USD base) bundled so the converter keeps working
// with zero network access. Overwritten the moment a live fetch succeeds.
export const BASELINE_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 154.5, UGX: 3685, KES: 129.2, TZS: 2650,
  RWF: 1320, BIF: 2890, ETB: 123.5, NGN: 1550, GHS: 15.3, ZAR: 18.1, EGP: 48.9,
  MAD: 9.9, DZD: 134.6, TND: 3.1, XOF: 603, XAF: 603, ZMW: 26.8, MWK: 1740,
  MZN: 63.9, BWP: 13.6, NAD: 18.1, SZL: 18.1, LSL: 18.1, AOA: 920, CDF: 2850,
  SDG: 601, SSP: 4500, SOS: 571, DJF: 177.7, ERN: 15, LYD: 4.85, SLE: 22.7,
  LRD: 192, GMD: 71.5, GNF: 8600, CVE: 101.5, STN: 22.3, MGA: 4480, MUR: 46.2,
  SCR: 13.6, KMF: 452, AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.307, BHD: 0.377,
  OMR: 0.385, JOD: 0.709, ILS: 3.7, LBP: 89500, IQD: 1310, IRR: 42000, YER: 250,
  TRY: 34.2, SYP: 13000, AFN: 70.2, PKR: 278, INR: 84.1, BDT: 119.5, LKR: 302,
  NPR: 134.3, BTN: 84.1, MVR: 15.4, MMK: 2100, THB: 34.6, VND: 25400, LAK: 21700,
  KHR: 4080, MYR: 4.46, SGD: 1.34, IDR: 15850, PHP: 58.1, BND: 1.34, CNY: 7.24,
  HKD: 7.79, TWD: 32.3, MOP: 8.03, KRW: 1395, KPW: 900, MNT: 3450, KZT: 495,
  UZS: 12750, TJS: 10.6, KGS: 87.4, TMT: 3.5, AZN: 1.7, GEL: 2.72, AMD: 390,
  RUB: 97.5, BYN: 3.27, UAH: 41.3, MDL: 17.7, RON: 4.58, BGN: 1.8, HUF: 383,
  PLN: 4.0, CZK: 23.4, HRK: 6.94, RSD: 107.6, ALL: 92.3, MKD: 56.6, BAM: 1.8,
  ISK: 138.5, NOK: 11.0, SEK: 10.8, DKK: 6.87, CHF: 0.88, CAD: 1.40, MXN: 20.1,
  GTQ: 7.73, HNL: 25.4, NIO: 36.8, CRC: 505, PAB: 1, DOP: 60.1, JMD: 157.2,
  TTD: 6.78, BBD: 2, BSD: 1, BZD: 2.01, KYD: 0.833, XCD: 2.70, HTG: 131.6,
  CUP: 24, AWG: 1.80, ANG: 1.79, BRL: 5.78, ARS: 1020, CLP: 980, COP: 4350,
  PEN: 3.75, BOB: 6.91, PYG: 7850, UYU: 42.3, VES: 50.1, GYD: 209.2, SRD: 36.4,
  AUD: 1.52, NZD: 1.68, FJD: 2.27, PGK: 4.0, SBD: 8.45, TOP: 2.37, WST: 2.76,
  VUV: 120.3, XPF: 109.8, JEP: 0.79, GIP: 0.79, IMP: 0.79,
};

function readCache(): RateSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RateSnapshot;
    if (!parsed || typeof parsed.rates !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(snapshot: RateSnapshot): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // storage unavailable (private mode / quota) — live rates still work for this session
  }
}

async function fetchJson(url: string, timeoutMs = 7000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalizePrimary(json: unknown): Record<string, number> | null {
  const obj = json as { result?: string; rates?: Record<string, number> };
  if (obj && obj.result === 'success' && obj.rates) return obj.rates;
  return null;
}

function normalizeFallback(json: unknown): Record<string, number> | null {
  const obj = json as { base?: string; rates?: Record<string, number> };
  if (obj && obj.rates) return { USD: 1, ...obj.rates };
  return null;
}

export async function getRates(forceRefresh = false): Promise<RateSnapshot> {
  const cached = readCache();
  const isFresh = cached && Date.now() - cached.fetchedAt < STALE_AFTER_MS;
  if (!forceRefresh && isFresh) {
    return { ...cached, source: 'cached' };
  }

  try {
    const json = await fetchJson(PRIMARY_URL);
    const rates = normalizePrimary(json);
    if (rates) {
      const snapshot: RateSnapshot = { base: 'USD', rates, fetchedAt: Date.now(), source: 'live-primary' };
      writeCache(snapshot);
      return snapshot;
    }
  } catch {
    // fall through to secondary source
  }

  try {
    const json = await fetchJson(FALLBACK_URL);
    const rates = normalizeFallback(json);
    if (rates) {
      const snapshot: RateSnapshot = { base: 'USD', rates, fetchedAt: Date.now(), source: 'live-fallback' };
      writeCache(snapshot);
      return snapshot;
    }
  } catch {
    // fall through to cached/baseline
  }

  if (cached) return { ...cached, source: 'cached' };
  return { base: 'USD', rates: BASELINE_RATES, fetchedAt: Date.now(), source: 'baseline' };
}

export function convertAmount(amount: number, from: string, to: string, rates: Record<string, number>): number {
  const fromRate = rates[from] ?? BASELINE_RATES[from] ?? 1;
  const toRate = rates[to] ?? BASELINE_RATES[to] ?? 1;
  const usd = amount / fromRate;
  return usd * toRate;
}

export function getExchangeRateLine(from: string, to: string, rates: Record<string, number>): number {
  return convertAmount(1, from, to, rates);
}

export function findCurrency(code: string): CurrencyMeta | undefined {
  return CURRENCIES.find((c) => c.code === code);
}
