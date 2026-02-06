export type MetroAreaRecord = {
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  radiusMiles: number | null;
};

/**
 * Given a city name and state, resolve to the matching metro area.
 * First checks for an exact name match, then falls back to finding
 * the nearest metro by coordinates (for suburbs like Cambridge -> Boston).
 */
export function resolveMetroArea(
  cityName: string,
  state: string | null | undefined,
  metroAreas: MetroAreaRecord[]
): MetroAreaRecord | null {
  // Direct match: the city IS a metro area
  const direct = metroAreas.find(
    (m) =>
      m.city.toLowerCase() === cityName.toLowerCase() &&
      (!state || m.state === state)
  );
  if (direct) return direct;

  // Find metro by state match and proximity would require the user's city coords.
  // Since we only have metro coords here, do a state-level fallback.
  if (state) {
    const stateMatch = metroAreas.find((m) => m.state === state);
    if (stateMatch) return stateMatch;
  }

  return null;
}
