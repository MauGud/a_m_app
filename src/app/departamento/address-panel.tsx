'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  APARTMENT,
  APARTMENT_ADDRESS,
  APARTMENT_ADDRESS_FULL,
  apartmentAppleMapsUrl,
  apartmentGeoUrl,
  apartmentMapsUrl,
  apartmentShareText,
  apartmentWazeUrl,
  apartmentWhatsAppUrl,
} from '@/lib/apartment';

export function AddressPanel() {
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState('');

  const copy = async (value: string, ok = 'Copiada 💕') => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        throw new Error('clipboard');
      }
      setCopied(true);
      setShareStatus(ok);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        setCopied(true);
        setShareStatus(ok);
      } catch {
        setCopied(false);
        setShareStatus('Copia a mano la dirección de arriba.');
      }
    }
    window.setTimeout(() => {
      setCopied(false);
      setShareStatus('');
    }, 2500);
  };

  const shareLocation = async () => {
    const text = apartmentShareText();
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Depto A & M',
          text,
          url: apartmentMapsUrl(),
        });
        setShareStatus('Ubicación compartida.');
        return;
      }
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
    }
    window.open(apartmentWhatsAppUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <p className="text-sm text-gray-600">Dirección</p>
        <h2 className="text-xl font-semibold text-gray-800">{APARTMENT.street}</h2>
        <p className="text-gray-600 leading-relaxed">{APARTMENT_ADDRESS_FULL}</p>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            {APARTMENT.neighborhood}, {APARTMENT.borough}
          </p>
          <p>
            {APARTMENT.postalCode} · {APARTMENT.city}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button className="w-full" onClick={shareLocation}>
            Compartir ubicación
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => copy(apartmentShareText(), 'Ubicación copiada')}>
            {copied ? 'Copiada 💕' : 'Copiar pin'}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a href={apartmentMapsUrl()} target="_blank" rel="noreferrer">
            <Button variant="secondary" className="w-full">
              Google Maps
            </Button>
          </a>
          <a href={apartmentAppleMapsUrl()} target="_blank" rel="noreferrer">
            <Button variant="secondary" className="w-full">
              Apple Maps
            </Button>
          </a>
          <a href={apartmentWazeUrl()} target="_blank" rel="noreferrer">
            <Button variant="secondary" className="w-full">
              Waze
            </Button>
          </a>
          <a href={apartmentWhatsAppUrl()} target="_blank" rel="noreferrer">
            <Button variant="secondary" className="w-full">
              WhatsApp
            </Button>
          </a>
        </div>
        <a href={apartmentGeoUrl()} className="block">
          <Button variant="ghost" className="w-full">
            Abrir en la app de mapas del celular
          </Button>
        </a>
        {shareStatus && <p className="text-sm text-gray-600">{shareStatus}</p>}
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
