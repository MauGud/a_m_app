'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/brand/brand-mark';
import { detectInstallPlatform, isStandaloneDisplay } from '@/lib/notifications';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPanel() {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [installed, setInstalled] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setPlatform(detectInstallPlatform());
    setInstalled(isStandaloneDisplay());
    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installAndroid = async () => {
    if (!promptEvent) {
      setStatus('En Android: menú ⋮ → Instalar app / Agregar a pantalla de inicio.');
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setStatus(choice.outcome === 'accepted' ? 'Listo, ya está en tu pantalla de inicio.' : 'No se instaló.');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center py-2">
        <BrandMark size={96} className="mb-2" />
        <p className="text-sm text-gray-600">A & M</p>
      </div>

      {installed && (
        <Card className="p-4">
          <p className="font-medium">Ya está abierta como app</p>
          <p className="text-sm text-gray-600">El icono de A & M quedó en la pantalla de inicio.</p>
        </Card>
      )}

      <Card className={`p-4 space-y-2 ${platform === 'ios' ? 'ring-2 ring-pastel-pink-200' : ''}`}>
        <h3 className="font-semibold">iPhone y iPad{platform === 'ios' ? ' · este celular' : ''}</h3>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal pl-5">
          <li>Abre esta página en Safari (no en Chrome).</li>
          <li>Toca el botón Compartir (el cuadrado con la flecha hacia arriba).</li>
          <li>Elige Agregar a pantalla de inicio.</li>
          <li>Confirma el nombre A & M. El icono de fuego y agua queda junto a WhatsApp y el resto.</li>
        </ol>
        <p className="text-xs text-gray-600">
          En iPhone los avisos de pagos funcionan después de instalarla así.
        </p>
      </Card>

      <Card className={`p-4 space-y-2 ${platform === 'android' ? 'ring-2 ring-pastel-pink-200' : ''}`}>
        <h3 className="font-semibold">Android{platform === 'android' ? ' · este celular' : ''}</h3>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal pl-5">
          <li>Ábrela en Chrome.</li>
          <li>Menú ⋮ → Instalar app o Agregar a pantalla de inicio.</li>
          <li>Acepta. El icono de A & M aparece en la bienvenida del celular.</li>
        </ol>
        {(platform === 'android' || promptEvent) && (
          <Button className="w-full" onClick={installAndroid}>
            Instalar ahora
          </Button>
        )}
      </Card>

      <Card className={`p-4 space-y-2 ${platform === 'desktop' ? 'ring-2 ring-pastel-pink-200' : ''}`}>
        <h3 className="font-semibold">Computadora{platform === 'desktop' ? ' · este dispositivo' : ''}</h3>
        <p className="text-sm text-gray-600">
          En Chrome o Edge: icono de instalar en la barra de direcciones, o menú → Instalar A & M.
        </p>
        {platform === 'desktop' && promptEvent && (
          <Button className="w-full" onClick={installAndroid}>
            Instalar ahora
          </Button>
        )}
      </Card>

      {status && <p className="text-sm text-center text-gray-600">{status}</p>}
    </div>
  );
}
