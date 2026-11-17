import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 3600;

type OffProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  image_front_small_url?: string;
  image_url?: string;
  quantity?: string;
};

function mapProduct(product: OffProduct) {
  return {
    code: product.code || '',
    name: product.product_name || 'Producto',
    brand: product.brands || 'Sin marca',
    image: product.image_front_small_url || product.image_url || null,
    quantity: product.quantity || '',
  };
}

async function searchOff(query: string, mexicoOnly: boolean) {
  const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  url.searchParams.set('search_terms', query);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', '12');
  url.searchParams.set(
    'fields',
    'product_name,brands,image_front_small_url,image_url,code,quantity'
  );
  if (mexicoOnly) {
    url.searchParams.set('tagtype_0', 'countries');
    url.searchParams.set('tag_contains_0', 'contains');
    url.searchParams.set('tag_0', 'mexico');
  }
  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'A-and-M-couple-app/1.0 (mau@nexcar.mx)',
      Accept: 'application/json',
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { products?: OffProduct[] };
  return (data.products || []).map(mapProduct).filter((item) => item.name !== 'Producto');
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ image: null, products: [] });
  try {
    let products = await searchOff(q, true);
    if (products.length === 0) products = await searchOff(q, false);
    return NextResponse.json({
      image: products[0]?.image || null,
      products,
    });
  } catch {
    return NextResponse.json({ image: null, products: [] });
  }
}
