export type Coordinates = {
  latitude: number;
  longitude: number;
};

export const haversineMiles = (a: Coordinates, b: Coordinates) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);

  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);

  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;

  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  const earthRadiusMiles = 3959;

  return earthRadiusMiles * c;
};

export const getDistanceMiles = (
  a?: Coordinates | null,
  b?: Coordinates | null
) => {
  if (!a || !b) return null;
  return haversineMiles(a, b);
};
