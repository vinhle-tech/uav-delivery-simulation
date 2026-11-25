import type { GeoPoint } from './types.js';
const EARTH_RADIUS_M = 6371008.8;
const rad = (d: number): number => d * Math.PI / 180;

/** Khoảng cách mặt đất WGS84 xấp xỉ theo Haversine (m). */
export function distanceM(a: GeoPoint, b: GeoPoint): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

/** Nội suy gần đúng theo kinh/vĩ độ, phù hợp tuyến demo ngắn <=2km (không dùng để dẫn đường thật). */
export function interpolate(a: GeoPoint, b: GeoPoint, t: number): GeoPoint {
  const k = Math.max(0, Math.min(1, t));
  return {
    lon: a.lon + (b.lon - a.lon) * k,
    lat: a.lat + (b.lat - a.lat) * k,
    altitudeM: a.altitudeM + (b.altitudeM - a.altitudeM) * k,
  };
}

export function routeDistanceM(points: GeoPoint[]): number {
  let result = 0;
  for (let i = 1; i < points.length; i++) result += distanceM(points[i - 1]!, points[i]!);
  return result;
}

export function validPoint(p: GeoPoint): boolean {
  return Number.isFinite(p.lon) && p.lon >= -180 && p.lon <= 180 &&
    Number.isFinite(p.lat) && p.lat >= -90 && p.lat <= 90 &&
    Number.isFinite(p.altitudeM) && p.altitudeM >= -500 && p.altitudeM <= 10000;
}

export function moveToward(from: GeoPoint, to: GeoPoint, speedMps: number, dtSec: number): { position: GeoPoint; movedM: number; arrived: boolean } {
  const remaining = distanceM(from, to);
  if (remaining <= 0.02) return { position: { ...to }, movedM: 0, arrived: true };
  const step = Math.max(0, speedMps * dtSec);
  if (step >= remaining) return { position: { ...to }, movedM: remaining, arrived: true };
  return { position: interpolate(from, to, step / remaining), movedM: step, arrived: false };
}
