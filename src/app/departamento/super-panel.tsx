'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  GROCERY_DEPARTMENTS,
  GROCERY_CATEGORIES,
  GROCERY_SKUS,
  ONLINE_PARTNERS,
  searchGrocery,
  type GrocerySku,
  type OnlinePartnerId,
} from '@/lib/grocery';
import { buildHandoff } from '@/lib/grocery-order';
import { useCartStore } from '@/stores/cart-store';
import { useUsageStore } from '@/stores/usage-store';
import { useAuthStore } from '@/stores/auth-store';
import { useVaultStore } from '@/stores/vault-store';
import { formatMoney } from '@/lib/finanzas';
import { notifyCouple } from '@/lib/notifications';
import { displayMethod } from '@/lib/payment-vault';
import { APARTMENT } from '@/lib/apartment';
import { cn } from '@/lib/utils';

const imageCache = new Map<string, string | null>();

function SkuPhoto({ sku }: { sku: GrocerySku }) {
  const [src, setSrc] = useState<string | null>(sku.image || imageCache.get(sku.query) || null);
  useEffect(() => {
    if (sku.image) {
      setSrc(sku.image);
      return;
    }
    if (imageCache.has(sku.query)) {
      setSrc(imageCache.get(sku.query) || null);
      return;
    }
    let alive = true;
    fetch(`/api/products?q=${encodeURIComponent(sku.query)}`)
      .then((res) => res.json())
      .then((data: { image: string | null }) => {
        imageCache.set(sku.query, data.image);
        if (alive) setSrc(data.image);
      })
      .catch(() => {
        imageCache.set(sku.query, null);
      });
    return () => {
      alive = false;
    };
  }, [sku.image, sku.query]);

  if (src) {
    return <img src={src} alt={sku.name} className="w-full h-24 object-contain bg-white rounded-xl" />;
  }
  return (
    <div className="w-full h-24 rounded-xl bg-pastel-blue-50 flex items-center justify-center text-3xl">
      {sku.emoji}
    </div>
  );
}

function liveToSku(row: { code: string; name: string; brand: string; image: string | null; quantity: string }): GrocerySku {
  return {
    id: `off-${row.code || row.name}`,
    name: row.name,
    brand: row.brand,
    department: 'Abarrotes',
    category: 'En línea',
    unit: row.quantity || 'pza',
    priceMxn: 0,
    query: row.name,
    emoji: '🛒',
    code: row.code,
    image: row.image || undefined,
    live: true,
  };
}

export function SuperPanel() {
  const { memberSlot } = useAuthStore();
  const track = useUsageStore((s) => s.track);
  const mode = useCartStore((s) => s.mode);
  const setMode = useCartStore((s) => s.setMode);
  const partnerId = useCartStore((s) => s.partnerId);
  const setPartner = useCartStore((s) => s.setPartner);
  const lines = useCartStore((s) => s.lines);
  const add = useCartStore((s) => s.add);
  const setQty = useCartStore((s) => s.setQty);
  const clear = useCartStore((s) => s.clear);
  const total = useCartStore((s) => s.total);
  const count = useCartStore((s) => s.count);
  const methods = useVaultStore((s) => s.methods);
  const isMau = memberSlot === 'MEMBER_B';
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [notice, setNotice] = useState('');
  const [shown, setShown] = useState(24);
  const [live, setLive] = useState<GrocerySku[]>([]);
  const [stores, setStores] = useState<Array<{ name: string; mapsUrl: string; partnerId: string | null }>>([]);

  const localSkus = useMemo(
    () => searchGrocery(query, department || undefined, category || undefined),
    [query, department, category]
  );
  const skus = useMemo(() => {
    const map = new Map<string, GrocerySku>();
    for (const sku of live) map.set(sku.id, sku);
    for (const sku of localSkus) map.set(sku.id, sku);
    return Array.from(map.values());
  }, [live, localSkus]);
  const categories = useMemo(() => {
    if (!department) return GROCERY_CATEGORIES;
    return Array.from(
      new Set(GROCERY_SKUS.filter((sku) => sku.department === department).map((sku) => sku.category))
    ).sort();
  }, [department]);

  useEffect(() => {
    track(memberSlot, 'super', department || 'todos');
  }, [department, memberSlot, track]);

  useEffect(() => {
    setShown(24);
  }, [query, department, category]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setLive([]);
      return;
    }
    const handle = window.setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data: { products?: Array<{ code: string; name: string; brand: string; image: string | null; quantity: string }> }) => {
          setLive((data.products || []).map(liveToSku));
        })
        .catch(() => setLive([]));
    }, 350);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    fetch(`/api/stores?lat=${APARTMENT.lat}&lng=${APARTMENT.lng}`)
      .then((res) => res.json())
      .then((data: { stores?: Array<{ name: string; mapsUrl: string; partnerId: string | null }> }) => {
        setStores(data.stores || []);
      })
      .catch(() => setStores([]));
  }, []);

  const remindCart = async () => {
    if (count() === 0) {
      setNotice('El carrito está vacío.');
      return;
    }
    await notifyCouple(
      'Super del depto',
      `Hay ${count()} cosas en el carrito (${formatMoney(total())}). No olviden pasarlas al súper.`,
      '/departamento?tab=super'
    );
    setNotice('Aviso listo. Si instalaron la app, también llega al teléfono.');
  };

  const pedir = async (id: OnlinePartnerId) => {
    if (count() === 0) {
      setNotice('Mete algo al carrito antes de pedir.');
      return;
    }
    setPartner(id);
    const handoff = buildHandoff(lines, id);
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(handoff.listText);
    } catch {
      // still open the store
    }
    window.open(handoff.searchUrl, '_blank', 'noopener,noreferrer');
    setNotice(
      `Lista copiada. Se abrió ${handoff.partnerName}. Paga allá, no aquí. ${
        isMau && methods[0] ? `Usa ${displayMethod(methods[0])} en su caja.` : ''
      }`
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('presencial')}
          className={cn(
            'flex-1 py-2 rounded-xl text-sm font-medium',
            mode === 'presencial' ? 'bg-pastel-pink-100' : 'bg-gray-100'
          )}
        >
          Presencial
        </button>
        <button
          onClick={() => setMode('enlinea')}
          className={cn(
            'flex-1 py-2 rounded-xl text-sm font-medium',
            mode === 'enlinea' ? 'bg-pastel-pink-100' : 'bg-gray-100'
          )}
        >
          En línea
        </button>
      </div>

      {mode === 'enlinea' && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium">Pedir en el súper</h3>
          <p className="text-sm text-gray-600">
            SKUs reales de Open Food Facts más el pasillo del depto. El cobro vive en el sitio del súper, no en A & M.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ONLINE_PARTNERS.map((partner) => (
              <Button
                key={partner.id}
                variant={partnerId === partner.id ? 'primary' : 'secondary'}
                onClick={() => pedir(partner.id)}
              >
                Pedir en {partner.name}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {mode === 'presencial' && stores.length > 0 && (
        <Card className="p-4 space-y-2">
          <h3 className="font-medium">Súpers cerca de Ocelotl 14</h3>
          {stores.slice(0, 6).map((store) => (
            <a key={`${store.name}-${store.mapsUrl}`} href={store.mapsUrl} target="_blank" rel="noreferrer" className="block text-sm text-gray-700">
              {store.name}
            </a>
          ))}
        </Card>
      )}

      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar SKU, marca o receta…" />
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setDepartment('')}
          className={cn('px-3 py-1.5 rounded-full text-xs whitespace-nowrap', !department ? 'bg-pastel-pink-100' : 'bg-white border')}
        >
          Todos
        </button>
        {GROCERY_DEPARTMENTS.map((item) => (
          <button
            key={item}
            onClick={() => {
              setDepartment(department === item ? '' : item);
              setCategory('');
            }}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs whitespace-nowrap',
              department === item ? 'bg-pastel-pink-100' : 'bg-white border border-gray-100'
            )}
          >
            {item}
          </button>
        ))}
      </div>
      {department && (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(category === item ? '' : item)}
            className={cn(
              'px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap',
              category === item ? 'bg-pastel-blue-100' : 'bg-white border border-gray-100'
            )}
          >
            {item}
          </button>
        ))}
      </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{skus.length} SKUs</p>
        <Button size="sm" onClick={() => setShowCart((v) => !v)}>
          Carrito {count()}
        </Button>
      </div>

      {showCart && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium">Carrito · sustituye la lista</h3>
          {lines.length === 0 && <p className="text-sm text-gray-500">Vacío. Toca un SKU para meterlo.</p>}
          {lines.map((line) => (
            <div key={line.sku.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex-1">
                {line.sku.emoji} {line.sku.name}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(line.sku.id, line.qty - 1)} className="w-8 h-8 rounded-full bg-gray-100">
                  −
                </button>
                <span>{line.qty}</span>
                <button onClick={() => setQty(line.sku.id, line.qty + 1)} className="w-8 h-8 rounded-full bg-gray-100">
                  +
                </button>
              </div>
            </div>
          ))}
          <p className="font-medium">{total() > 0 ? formatMoney(total()) : 'Precio en caja del súper'}</p>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={clear}>
              Vaciar
            </Button>
            <Button className="flex-1" onClick={remindCart}>
              Avisarnos
            </Button>
          </div>
          {notice && <p className="text-sm text-gray-600">{notice}</p>}
        </Card>
      )}
      {notice && !showCart && <p className="text-sm text-gray-600">{notice}</p>}

      <div className="grid grid-cols-2 gap-3">
        {skus.slice(0, shown).map((sku) => (
          <Card key={sku.id} className="p-3 space-y-2">
            <SkuPhoto sku={sku} />
            <p className="text-[11px] text-gray-500">{sku.brand} · {sku.department}</p>
            <p className="text-sm font-medium leading-snug">{sku.name}</p>
            <p className="text-xs text-gray-600">
              {sku.live || sku.priceMxn === 0 ? 'precio en el súper' : `${formatMoney(sku.priceMxn)} referencia`} · {sku.unit}
            </p>
            <Button size="sm" className="w-full" onClick={() => add(sku)}>
              Al carrito
            </Button>
          </Card>
        ))}
      </div>
      {shown < skus.length && (
        <Button variant="ghost" className="w-full" onClick={() => setShown((n) => n + 24)}>
          Ver más SKUs ({skus.length - shown})
        </Button>
      )}
    </div>
  );
}
