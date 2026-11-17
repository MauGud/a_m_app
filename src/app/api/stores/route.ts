import { NextRequest, NextResponse } from 'next/server';
import { APARTMENT } from '@/lib/apartment';
import { ONLINE_PARTNERS } from '@/lib/grocery';

export const revalidate = 0;

interface NearbyStore {
  name: string;
  partnerId: string | null;
  lat: number;
  lng: number;
  mapsUrl: string;
}

function partnerIdFromName(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('chedraui')) return 'chedraui';
  if (lower.includes('soriana')) return 'soriana';
  if (lower.includes('walmart') || lower.includes('aurrera')) return 'walmart';
  if (lower.includes('justo') || lower.includes('jüsto')) return 'justo';
  return null;
}

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get('lat') || APARTMENT.lat);
  const lng = Number(request.nextUrl.searchParams.get('lng') || APARTMENT.lng);
  const query = `[out:json][timeout:12];
(
  node["shop"="supermarket"](around:8000,${lat},${lng});
  way["shop"="supermarket"](around:8000,${lat},${lng});
);
out center 30;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'User-Agent': 'A-and-M-couple-app/1.0 (mau@nexcar.mx)',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: `data=${encodeURIComponent(query)}`,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('overpass');
    const data = (await res.json()) as {
      elements?: Array<{ tags?: { name?: string; brand?: string }; lat?: number; lon?: number; center?: { lat: number; lon: number } }>;
    };
    const stores: NearbyStore[] = (data.elements || [])
      .map((el) => {
        const name = el.tags?.name || el.tags?.brand || '';
        const pointLat = el.lat || el.center?.lat;
        const pointLng = el.lon || el.center?.lon;
        if (!name || pointLat == null || pointLng == null) return null;
        return {
          name,
          partnerId: partnerIdFromName(name),
          lat: pointLat,
          lng: pointLng,
          mapsUrl: `https://www.google.com/maps?q=${pointLat},${pointLng}`,
        };
      })
      .filter((row): row is NearbyStore => Boolean(row))
      .filter((row) => row.partnerId || /chedraui|soriana|walmart|aurrera|justo/i.test(row.name))
      .slice(0, 12);

    if (stores.length > 0) return NextResponse.json({ stores, source: 'overpass' });
  } catch {
    // fallback below
  }

  const stores = ONLINE_PARTNERS.map((partner) => ({
    name: `${partner.name} cerca del depto`,
    partnerId: partner.id,
    lat,
    lng,
    mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(`${partner.name} ${APARTMENT.neighborhood}`)}`,
  }));
  return NextResponse.json({ stores, source: 'maps' });
}
