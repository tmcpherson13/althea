/**
 * Weather via Open-Meteo (free, no API key). Two paths:
 *  - Trips within the ~16-day forecast window → live forecast.
 *  - Trips further out (or in the past) → seasonal normal, approximated from
 *    the archive for the same calendar dates a year prior.
 *
 * Geocoding also yields the ISO country code, which feeds the culture KB.
 * Network calls are thin; the mapping helpers are pure and unit-tested. The
 * agent sandbox blocks open-meteo hosts by network policy, so the live path
 * is exercised on-device, not in CI.
 */

const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';

/** Longest lead the forecast API covers; beyond this we fall back to seasonal. */
export const FORECAST_HORIZON_DAYS = 15;

export type Place = {
  name: string;
  country: string;
  countryCode: string; // ISO-3166 alpha-2, feeds culture_norms lookup
  latitude: number;
  longitude: number;
  timezone: string;
};

export type WeatherBand = {
  highC: number;
  lowC: number;
  precipChance: number; // 0–100
  source: 'forecast' | 'seasonal';
  label: string;
};

// ---------- pure helpers (unit-tested) ----------

export function median(xs: number[]): number {
  const clean = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (clean.length === 0) return 0;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
}

export function bandFromDaily(
  maxC: number[],
  minC: number[],
  precipPct?: number[]
): { highC: number; lowC: number; precipChance: number } {
  return {
    highC: Math.round(median(maxC)),
    lowC: Math.round(median(minC)),
    precipChance: precipPct && precipPct.length ? Math.round(median(precipPct)) : 0,
  };
}

/** Whole days from `todayISO` to `startISO` (both YYYY-MM-DD). Negative = past. */
export function daysUntil(startISO: string, todayISO: string): number {
  const ms = Date.parse(`${startISO}T00:00:00Z`) - Date.parse(`${todayISO}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function chooseSource(daysAway: number): 'forecast' | 'seasonal' {
  return daysAway >= 0 && daysAway <= FORECAST_HORIZON_DAYS ? 'forecast' : 'seasonal';
}

/** Move a YYYY-MM-DD to the same month/day in another year (Feb 29 → Feb 28). */
export function shiftToYear(iso: string, year: number): string {
  const [, mm, dd] = iso.split('-');
  const day = mm === '02' && dd === '29' ? '28' : dd;
  return `${year}-${mm}-${day}`;
}

/** Share of archive days with ≥1 mm rain → a rough "chance of a wet day". */
export function wetDayChance(precipSumMm: number[]): number {
  if (!precipSumMm.length) return 0;
  const wet = precipSumMm.filter((mm) => mm >= 1).length;
  return Math.round((100 * wet) / precipSumMm.length);
}

export function bandLabel(b: { highC: number; lowC: number; precipChance: number }): string {
  return `${b.highC}° days · ${b.lowC}° nights · ${b.precipChance}% rain`;
}

// ---------- network ----------

export async function geocode(query: string): Promise<Place | null> {
  const url = `${GEOCODE}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: Record<string, unknown>[] };
  const r = data.results?.[0];
  if (!r) return null;
  return {
    name: String(r.name ?? query),
    country: String(r.country ?? ''),
    countryCode: String(r.country_code ?? ''),
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    timezone: String(r.timezone ?? 'auto'),
  };
}

type DailyForecast = { max: number[]; min: number[]; precip: number[] };

async function fetchForecast(
  place: Place,
  range: { start: string; end: string } | { forecastDays: number }
): Promise<DailyForecast> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
  });
  if ('forecastDays' in range) params.set('forecast_days', String(range.forecastDays));
  else {
    params.set('start_date', range.start);
    params.set('end_date', range.end);
  }
  const res = await fetch(`${FORECAST}?${params.toString()}`);
  const data = (await res.json()) as { daily?: Record<string, number[]> };
  const d = data.daily ?? {};
  return {
    max: d.temperature_2m_max ?? [],
    min: d.temperature_2m_min ?? [],
    precip: d.precipitation_probability_max ?? [],
  };
}

async function fetchArchive(
  place: Place,
  start: string,
  end: string
): Promise<{ max: number[]; min: number[]; precipSum: number[] }> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    start_date: start,
    end_date: end,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto',
  });
  const res = await fetch(`${ARCHIVE}?${params.toString()}`);
  const data = (await res.json()) as { daily?: Record<string, number[]> };
  const d = data.daily ?? {};
  return {
    max: d.temperature_2m_max ?? [],
    min: d.temperature_2m_min ?? [],
    precipSum: d.precipitation_sum ?? [],
  };
}

/**
 * Weather band for a trip. Pass ISO dates when known; without them, returns an
 * indicative one-week forecast for the destination.
 */
export async function weatherForTrip(
  place: Place,
  startISO?: string,
  endISO?: string
): Promise<WeatherBand> {
  const today = new Date().toISOString().slice(0, 10);

  if (!startISO) {
    const d = await fetchForecast(place, { forecastDays: 7 });
    const b = bandFromDaily(d.max, d.min, d.precip);
    return { ...b, source: 'forecast', label: bandLabel(b) };
  }

  const end = endISO ?? startISO;
  if (chooseSource(daysUntil(startISO, today)) === 'forecast') {
    const d = await fetchForecast(place, { start: startISO, end });
    const b = bandFromDaily(d.max, d.min, d.precip);
    return { ...b, source: 'forecast', label: bandLabel(b) };
  }

  const refYear = new Date().getUTCFullYear() - 1;
  const d = await fetchArchive(place, shiftToYear(startISO, refYear), shiftToYear(end, refYear));
  const partial = bandFromDaily(d.max, d.min);
  const b = { ...partial, precipChance: wetDayChance(d.precipSum) };
  return { ...b, source: 'seasonal', label: bandLabel(b) };
}
