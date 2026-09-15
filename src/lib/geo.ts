export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | undefined> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = await res.json();
    const parts = [
      data.locality || data.city,
      data.principalSubdivision,
      data.countryName,
    ].filter(Boolean);
    return parts.length ? Array.from(new Set(parts)).join(', ') : undefined;
  } catch {
    return undefined;
  }
}

export function mapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
