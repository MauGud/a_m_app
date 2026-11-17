'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  APARTMENT,
  APARTMENT_ADDRESS,
  APARTMENT_ADDRESS_FULL,
  apartmentMapsUrl,
} from '@/lib/apartment';

export function AddressPanel() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(APARTMENT_ADDRESS_FULL);
      } else {
        throw new Error('clipboard');
      }
      setCopied(true);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = APARTMENT_ADDRESS_FULL;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        setCopied(true);
      } catch {
        setCopied(false);
      }
    }
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <p className="text-sm text-gray-600">Dirección</p>
        <h2 className="text-xl font-semibold text-gray-800">{APARTMENT.street}</h2>
        <p className="text-gray-600 leading-relaxed">{APARTMENT_ADDRESS_FULL}</p>
        <div className="text-sm text-gray-600 space-y-1">
          <p>{APARTMENT.neighborhood}, {APARTMENT.borough}</p>
          <p>{APARTMENT.postalCode} · {APARTMENT.city}</p>
        </div>
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={copy}>
            {copied ? 'Copiada 💕' : 'Copiar dirección'}
          </Button>
          <a
            href={apartmentMapsUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex-1"
          >
            <Button variant="secondary" className="w-full">
              Abrir mapa
            </Button>
          </a>
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-sm text-gray-600">
          Para entregas y visitas usen exactamente:{' '}
          <span className="font-medium text-gray-800">{APARTMENT_ADDRESS}</span>
        </p>
      </Card>
    </div>
  );
}
