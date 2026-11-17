import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ places: [] });
  }
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '8');
  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'A-and-M-couple-app/1.0 (https://github.com; dates search)',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ places: [] });
    const raw = (await res.json()) as Array<{
      display_name: string;
      name?: string;
      address?: { city?: string; town?: string; village?: string; state?: string; country?: string };
    }>;
    const places = raw
      .map((row) => ({
        label: row.display_name,
        city: row.address?.city || row.address?.town || row.address?.village || row.name || '',
        state: row.address?.state || '',
        country: row.address?.country || '',
      }))
      .sort((a, b) => Number(b.country === 'México') - Number(a.country === 'México'));
    return NextResponse.json({ places });
  } catch {
    return NextResponse.json({ places: [] });
  }
}
