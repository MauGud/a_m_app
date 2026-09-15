'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SectionIntro } from '@/components/ui/section-intro';
import { useAuthStore } from '@/stores/auth-store';
import { useMemoriesStore } from '@/stores/memories-store';
import { cn, formatDateTime, getTodayISO } from '@/lib/utils';
import { reverseGeocode, type GeoLocation } from '@/lib/geo';
import { saveImagesToDeviceGallery } from '@/lib/gallery';
import { useUserMedia } from '@/lib/use-user-media';

type CaptureStep = 'ready' | 'capturing_back' | 'capturing_front' | 'preview' | 'details';

export default function NuevoRecuerdoPage() {
  const router = useRouter();
  const { memberSlot } = useAuthStore();
  const { addMemory } = useMemoriesStore();

  const [step, setStep] = useState<CaptureStep>('ready');
  const [imageBack, setImageBack] = useState<string | null>(null);
  const [imageFront, setImageFront] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationLabel, setLocationLabel] = useState('Buscando lugar...');
  const [placeStatus, setPlaceStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  const [saving, setSaving] = useState(false);
  const [capturedAt, setCapturedAt] = useState('');

  const facingMode = step === 'capturing_front' ? 'user' : 'environment';
  const { videoRef, error, capturePhoto } = useUserMedia(
    step === 'capturing_back' || step === 'capturing_front',
    facingMode
  );

  const handleCaptureBack = () => {
    const photo = capturePhoto();
    if (photo) {
      setImageBack(photo);
      setStep('capturing_front');
    }
  };

  const handleCaptureFront = () => {
    const photo = capturePhoto();
    if (photo) {
      setImageFront(photo);
      setCapturedAt(formatDateTime(new Date()));
      setStep('preview');
    }
  };

  const handleRetake = () => {
    setImageBack(null);
    setImageFront(null);
    setLocation(null);
    setLocationLabel('Buscando lugar...');
    setPlaceStatus('idle');
    setCapturedAt('');
    setStep('ready');
  };

  const handleContinue = () => {
    setPlaceStatus('loading');
    setLocationLabel('Buscando lugar...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          const address = await reverseGeocode(coords.latitude, coords.longitude);
          setLocation({ ...coords, address });
          setLocationLabel(address || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
          setPlaceStatus('ready');
        },
        () => {
          setLocationLabel('Lugar no disponible');
          setPlaceStatus('unavailable');
        },
        { timeout: 8000, maximumAge: 60_000 }
      );
    } else {
      setLocationLabel('Lugar no disponible');
      setPlaceStatus('unavailable');
    }
    setStep('details');
  };

  const handleSave = async () => {
    if (!imageBack || !imageFront || !memberSlot || saving) return;
    setSaving(true);
    try {
      const stamp = getTodayISO();
      await addMemory({
        image_back: imageBack,
        image_front: imageFront,
        caption: caption || undefined,
        location: location || undefined,
        created_by: memberSlot,
      });
      const gallery = saveImagesToDeviceGallery([
        { dataUrl: imageBack, filename: `recuerdo-${stamp}-lugar.jpg` },
        { dataUrl: imageFront, filename: `recuerdo-${stamp}-nosotros.jpg` },
      ]).catch((err) => {
        console.warn('Could not save memory to device gallery:', err);
      });
      await Promise.race([gallery, new Promise((resolve) => setTimeout(resolve, 2500))]);
      router.push('/recuerdos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Recuerdos">
      <div className="page-container">
        {step === 'ready' && (
          <div className="space-y-6">
            <SectionIntro emoji="📸" title="Un instante, dos miradas">
              Capturen lo que ven y cómo se ven ustedes. Cada recuerdo guarda fecha y lugar, y las
              fotos se descargan solas a la galería del teléfono.
            </SectionIntro>
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <div className="text-center mb-8">
                <span className="text-6xl mb-4 block">📸</span>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Captura un recuerdo
                </h2>
                <p className="text-gray-600">
                  Tomaremos 2 fotos: lo que ves y ustedes
                </p>
              </div>
              <Button onClick={() => setStep('capturing_back')} size="lg">
                Comenzar
              </Button>
            </div>
          </div>
        )}

        {(step === 'capturing_back' || step === 'capturing_front') && (
          <div className="space-y-4">
            <div className="relative aspect-[3/4] bg-black rounded-2xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  'w-full h-full object-cover',
                  step === 'capturing_front' && 'scale-x-[-1]'
                )}
              />
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <p className="text-white text-center p-4">{error}</p>
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-lg font-medium text-gray-800 mb-4">
                {step === 'capturing_back' ? '📷 Foto de lo que ven' : '🤳 Ahora ustedes'}
              </p>
              <Button
                onClick={step === 'capturing_back' ? handleCaptureBack : handleCaptureFront}
                size="lg"
                className="w-20 h-20 rounded-full"
              >
                📸
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && imageBack && imageFront && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1 text-center">Lo que ven</p>
                <img
                  src={imageBack}
                  alt="Back"
                  className="w-full aspect-[3/4] object-cover rounded-xl"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 text-center">Ustedes</p>
                <img
                  src={imageFront}
                  alt="Front"
                  className="w-full aspect-[3/4] object-cover rounded-xl scale-x-[-1]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleRetake} className="flex-1">
                Volver a tomar
              </Button>
              <Button onClick={handleContinue} className="flex-1">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-center">
              Detalles del recuerdo
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {imageBack && (
                <img src={imageBack} alt="" className="rounded-lg aspect-square object-cover" />
              )}
              {imageFront && (
                <img src={imageFront} alt="" className="rounded-lg aspect-square object-cover scale-x-[-1]" />
              )}
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>📅 {capturedAt}</p>
              <p>📍 {location?.address || locationLabel}</p>
            </div>

            <Input
              placeholder="Escribe un caption (opcional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />

            <Button onClick={handleSave} className="w-full" size="lg" disabled={saving || placeStatus === 'loading'}>
              {saving ? 'Guardando...' : placeStatus === 'loading' ? 'Buscando lugar...' : 'Guardar recuerdo 💕'}
            </Button>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
