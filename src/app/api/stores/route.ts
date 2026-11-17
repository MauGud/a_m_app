import { NextResponse } from 'next/server';
import { NEARBY_STORES, storeDistanceKm } from '@/lib/grocery-stores';

export const revalidate = 86400;

export async function GET() {
  const stores = NEARBY_STORES.map((store) => ({
    ...store,
    km: Number(storeDistanceKm(store).toFixed(2)),
  })).sort((a, b) => a.km - b.km);
  return NextResponse.json({ stores, source: 'local' });
}
