'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  GROCERY_DEPARTMENTS,
  GROCERY_SKUS,
  LIST_TEMPLATES,
  NEARBY_STORES,
  nearestStore,
  recommendStore,
  searchGrocery,
  storeDistanceKm,
  storesForTrip,
  templateSkus,
  unitPrice,
  type TripKind,
} from '@/lib/grocery';
import { buildListText, whatsappListUrl } from '@/lib/grocery-order';
import { useCartStore } from '@/stores/cart-store';
import { usePriceBookStore } from '@/stores/price-book-store';
import { useUsageStore } from '@/stores/usage-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatMoney } from '@/lib/finanzas';
import { notifyCouple } from '@/lib/notifications';
import { cn } from '@/lib/utils';

const TRIPS: { id: TripKind; label: string }[] = [
  { id: 'semana', label: 'Semana' },
  { id: 'quincena', label: 'Quincena' },
  { id: 'mes', label: 'Mes' },
];

export function SuperPanel() {
  const { memberSlot } = useAuthStore();
  const track = useUsageStore((s) => s.track);
  const trip = useCartStore((s) => s.trip);
  const setTrip = useCartStore((s) => s.setTrip);
  const designatedStoreId = useCartStore((s) => s.designatedStoreId);
  const setDesignatedStore = useCartStore((s) => s.setDesignatedStore);
  const lines = useCartStore((s) => s.lines);
  const add = useCartStore((s) => s.add);
  const addMany = useCartStore((s) => s.addMany);
  const setQty = useCartStore((s) => s.setQty);
  const clear = useCartStore((s) => s.clear);
  const count = useCartStore((s) => s.count);
  const book = usePriceBookStore((s) => s.book);
  const setPrice = usePriceBookStore((s) => s.setPrice);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');
  const [shown, setShown] = useState(24);
  const [notice, setNotice] = useState('');
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});

  const recommendation = useMemo(
    () => recommendStore(lines, trip, book, designatedStoreId),
    [book, designatedStoreId, lines, trip]
  );
  const activeStore = recommendation.pick;
  const skus = useMemo(
    () => searchGrocery(query, department || undefined, category || undefined, query.trim() ? undefined : trip),
    [category, department, query, trip]
  );
  const categories = useMemo(() => {
    const pool = department ? GROCERY_SKUS.filter((sku) => sku.department === department) : GROCERY_SKUS;
    return Array.from(new Set(pool.map((sku) => sku.category))).sort();
  }, [department]);

  useEffect(() => {
    track(memberSlot, 'super', trip);
  }, [memberSlot, track, trip]);

  useEffect(() => {
    setShown(24);
  }, [query, department, category, trip]);

  useEffect(() => {
    const allowed = storesForTrip(trip);
    if (!allowed.some((store) => store.id === designatedStoreId)) {
      setDesignatedStore(nearestStore(trip).id);
    }
  }, [designatedStoreId, setDesignatedStore, trip]);

  const copyList = async () => {
    const text = buildListText(lines, activeStore, book);
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      setNotice('Lista copiada. Llévenla al pasillo.');
    } catch {
      setNotice('Copia a mano o mándala por WhatsApp.');
    }
  };

  const remindCart = async () => {
    if (count() === 0) {
      setNotice('La lista está vacía.');
      return;
    }
    await notifyCouple(
      'Súper del depto',
      `${count()} cosas para ${activeStore.name}. ${recommendation.reason}.`,
      '/departamento?tab=super'
    );
    setNotice('Aviso listo.');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TRIPS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTrip(item.id)}
            className={cn(
              'flex-1 py-2 rounded-xl text-sm font-medium',
              trip === item.id ? 'bg-pastel-pink-100' : 'bg-gray-100'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card className="p-4 space-y-2">
        <p className="text-xs text-gray-500">
          {trip === 'mes' ? 'Mayoreo con membresía' : 'Súper de la semana, el más cercano primero'}
        </p>
        <h3 className="font-medium">{activeStore.name}</h3>
        <p className="text-sm text-gray-600">
          {storeDistanceKm(activeStore).toFixed(1)} km · {activeStore.address}
        </p>
        <p className="text-sm text-gray-700">{recommendation.reason}</p>
        {lines.length > 0 && recommendation.ranked[0] && (
          <p className="text-sm font-medium">
            Lista: {formatMoney(recommendation.ranked[0].subtotal)}
            {recommendation.ranked[0].coverage < 1
              ? ` · ${Math.round(recommendation.ranked[0].coverage * 100)}% de la lista tiene precio`
              : ''}
          </p>
        )}
        <div className="flex gap-2">
          <a href={activeStore.mapsUrl} target="_blank" rel="noreferrer" className="flex-1">
            <Button variant="secondary" className="w-full">
              Cómo llegar
            </Button>
          </a>
          <a href={whatsappListUrl(buildListText(lines, activeStore, book))} target="_blank" rel="noreferrer" className="flex-1">
            <Button variant="secondary" className="w-full">
              WhatsApp
            </Button>
          </a>
        </div>
      </Card>

      {recommendation.ranked.length > 1 && lines.length > 0 && (
        <Card className="p-4 space-y-2">
          <h3 className="font-medium">Sucursales para esta lista</h3>
          {recommendation.ranked.map((row, index) => (
            <button
              key={row.store.id}
              type="button"
              onClick={() => setDesignatedStore(row.store.id)}
              className={cn(
                'w-full text-left rounded-xl px-3 py-2 text-sm',
                row.store.id === activeStore.id ? 'bg-pastel-green-50' : 'bg-gray-50'
              )}
            >
              <span className="font-medium">
                {index === 0 ? '1. ' : `${index + 1}. `}
                {row.store.name}
              </span>
              <span className="block text-xs text-gray-600">
                {row.subtotal > 0 ? formatMoney(row.subtotal) : 'sin precio de caja'} · {row.km.toFixed(1)} km
                {row.sourceMix.caja ? ` · ${row.sourceMix.caja} vistos en caja` : ''}
              </span>
            </button>
          ))}
        </Card>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {LIST_TEMPLATES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTrip(item.id);
              addMany(templateSkus(item.id));
              setNotice(`${item.label} metida a la lista.`);
            }}
            className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap bg-white border border-pastel-pink-100"
          >
            {item.label}
          </button>
        ))}
      </div>

      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busca Lala, Bimbo, Pétalo, pechuga…" />
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

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Lista {count()}</h3>
          <Button size="sm" variant="ghost" onClick={clear} disabled={count() === 0}>
            Vaciar
          </Button>
        </div>
        {lines.length === 0 && <p className="text-sm text-gray-500">Toca un SKU o una despensa lista.</p>}
        {lines.map((line) => {
          const unit = unitPrice(line.sku, activeStore, book);
          return (
            <div key={line.sku.id} className="space-y-2 border-b border-gray-100 pb-2">
              <div className="flex items-center justify-between gap-2 text-sm">
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
              <p className="text-xs text-gray-500">
                {unit.price > 0 ? `${formatMoney(unit.price)} · visto en caja` : 'sin precio de caja'}
              </p>
              <div className="flex gap-2">
                <Input
                  inputMode="decimal"
                  placeholder="Precio de caja"
                  value={priceDraft[line.sku.id] || ''}
                  onChange={(e) => setPriceDraft((current) => ({ ...current, [line.sku.id]: e.target.value }))}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const value = Number((priceDraft[line.sku.id] || '').replace(',', '.'));
                    if (!Number.isFinite(value) || value <= 0) return;
                    setPrice(activeStore.id, line.sku.id, value);
                    setPriceDraft((current) => ({ ...current, [line.sku.id]: '' }));
                  }}
                >
                  Anotar
                </Button>
              </div>
            </div>
          );
        })}
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={copyList} disabled={count() === 0}>
            Copiar lista
          </Button>
          <Button className="flex-1" onClick={remindCart} disabled={count() === 0}>
            Avisarnos
          </Button>
        </div>
        {notice && <p className="text-sm text-gray-600">{notice}</p>}
      </Card>

      <p className="text-xs text-gray-500">
        {skus.length} SKUs de pasillo. El total de la lista solo usa precios que anoten en caja.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {skus.slice(0, shown).map((sku) => {
          const unit = unitPrice(sku, activeStore, book);
          return (
            <Card key={sku.id} className="p-3 space-y-2">
              <div className="w-full h-20 rounded-xl bg-pastel-blue-50 flex items-center justify-center text-3xl">
                {sku.emoji}
              </div>
              <p className="text-[11px] text-gray-500">
                {sku.brand} · {sku.department}
              </p>
              <p className="text-sm font-medium leading-snug">{sku.name}</p>
              <p className="text-xs text-gray-600">
                {unit.price > 0 ? `${formatMoney(unit.price)} caja` : 'sin precio de caja'} · {sku.unit}
              </p>
              <Button size="sm" className="w-full" onClick={() => add(sku)}>
                A la lista
              </Button>
            </Card>
          );
        })}
      </div>
      {shown < skus.length && (
        <Button variant="ghost" className="w-full" onClick={() => setShown((n) => n + 24)}>
          Ver más SKUs ({skus.length - shown})
        </Button>
      )}
      <p className="text-[11px] text-gray-400">
        {NEARBY_STORES.length} sucursales alrededor de Ocelotl 14, guardadas en la app.
      </p>
    </div>
  );
}
