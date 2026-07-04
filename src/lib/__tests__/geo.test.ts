import { describe, expect, it } from 'vitest';

import { boundingBox, projectPoints } from '../geo';

describe('boundingBox', () => {
  it('returns the extent of the points', () => {
    expect(
      boundingBox([
        { latitude: 10, longitude: -5 },
        { latitude: 20, longitude: 15 },
      ])
    ).toEqual({ minLat: 10, maxLat: 20, minLon: -5, maxLon: 15 });
  });
  it('is null when there are no finite points', () => {
    expect(boundingBox([])).toBeNull();
    expect(boundingBox([{ latitude: NaN, longitude: 0 }])).toBeNull();
  });
});

describe('projectPoints', () => {
  it('maps every point inside the box', () => {
    const pts = projectPoints(
      [
        { latitude: 40, longitude: -3 },
        { latitude: 48, longitude: 2 },
        { latitude: 52, longitude: 13 },
      ],
      200,
      200
    );
    expect(pts).toHaveLength(3);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(200);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(200);
    }
  });

  it('puts north at the top (higher latitude → smaller y)', () => {
    const [south, north] = projectPoints(
      [
        { latitude: 40, longitude: 0 },
        { latitude: 50, longitude: 0 },
      ],
      100,
      100
    );
    expect(north.y).toBeLessThan(south.y);
  });

  it('puts east to the right (higher longitude → larger x)', () => {
    const [west, east] = projectPoints(
      [
        { latitude: 0, longitude: -10 },
        { latitude: 0, longitude: 10 },
      ],
      100,
      100
    );
    expect(east.x).toBeGreaterThan(west.x);
  });

  it('centres a single point without dividing by zero', () => {
    const [p] = projectPoints([{ latitude: 35, longitude: 139 }], 100, 100);
    expect(p.x).toBeCloseTo(50, 0);
    expect(p.y).toBeCloseTo(50, 0);
  });

  it('drops non-finite points', () => {
    expect(projectPoints([{ latitude: NaN, longitude: NaN }], 100, 100)).toHaveLength(0);
  });
});
