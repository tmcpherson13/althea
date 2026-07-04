/**
 * Map projection for the journey view. We don't ship map tiles — the journey
 * map is a route line + pins fitted to the bounding box of the visited places
 * (the Polarsteps signature), drawn in SVG. These helpers are pure and
 * unit-tested; real tiles (Mapbox) are a later enhancement.
 */

export type GeoPoint = { latitude: number; longitude: number };

/** Minimum degree span so a single point / tight cluster doesn't divide by zero. */
const MIN_SPAN = 0.5;

export type Bounds = { minLat: number; maxLat: number; minLon: number; maxLon: number };

export function boundingBox(points: GeoPoint[]): Bounds | null {
  const pts = points.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
  if (pts.length === 0) return null;
  return pts.reduce<Bounds>(
    (b, p) => ({
      minLat: Math.min(b.minLat, p.latitude),
      maxLat: Math.max(b.maxLat, p.latitude),
      minLon: Math.min(b.minLon, p.longitude),
      maxLon: Math.max(b.maxLon, p.longitude),
    }),
    { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 }
  );
}

/**
 * Project points into a width×height box (north up), fitted to their bounds
 * with `pad` fractional margin. Degenerate spans expand to MIN_SPAN so a lone
 * pin lands near the centre. Returns one {x,y} per finite input point.
 */
export function projectPoints(
  points: GeoPoint[],
  width: number,
  height: number,
  pad = 0.15
): { x: number; y: number }[] {
  const pts = points.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
  const b = boundingBox(pts);
  if (!b) return [];

  const cLat = (b.minLat + b.maxLat) / 2;
  const cLon = (b.minLon + b.maxLon) / 2;
  const latSpan = Math.max(b.maxLat - b.minLat, MIN_SPAN) * (1 + pad * 2);
  const lonSpan = Math.max(b.maxLon - b.minLon, MIN_SPAN) * (1 + pad * 2);

  const minLat = cLat - latSpan / 2;
  const minLon = cLon - lonSpan / 2;

  return pts.map((p) => ({
    x: ((p.longitude - minLon) / lonSpan) * width,
    y: ((minLat + latSpan - p.latitude) / latSpan) * height, // invert: north = top
  }));
}
