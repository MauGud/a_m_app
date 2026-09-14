'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { useMemoriesStore } from '@/stores/memories-store';
import { cn } from '@/lib/utils';

type CaptureStep = 'ready' | 'capturing_back' | 'capturing_front' | 'preview' | 'details';

export default function CamaraPage() {
  const router = useRouter();
  const { memberSlot } = useAuthStore();
  const { addMemory } = useMemoriesStore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [step, setStep] = useState<CaptureStep>('ready');
  const [imageBack, setImageBack] = useState<string | null>(null);
  const [imageFront, setImageFront] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async (facingMode: 'environment' | 'user') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch (err) {
      setError('No se pudo acceder a la cámara');
      console.error(err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const handleStartCapture = async () => {
    setStep('capturing_back');
    await startCamera('environment');
  };

  const handleCaptureBack = () => {
    const photo = capturePhoto();
    if (photo) {
      setImageBack(photo);
      stopCamera();
      setStep('capturing_front');
      setTimeout(() => startCamera('user'), 100);
    }
  };

  const handleCaptureFront = () => {
    const photo = capturePhoto();
    if (photo) {
      setImageFront(photo);
      stopCamera();
      setStep('preview');
    }
  };

  const handleRetake = () => {
    setImageBack(null);
    setImageFront(null);
    setStep('ready');
  };

  const handleContinue = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {}
      );
    }
    setStep('details');
  };

  const handleSave = () => {
    if (imageBack && imageFront && memberSlot) {
      addMemory({
        image_back: imageBack,
        image_front: imageFront,
        caption: caption || undefined,
        location: location || undefined,
        created_by: memberSlot,
      });
      router.push('/recuerdos');
    }
  };

  return (
    <AppLayout title="Cámara">
      <div className="page-container">
        {step === 'ready' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-8">
              <span className="text-6xl mb-4 block">📸</span>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Captura un recuerdo
              </h2>
              <p className="text-gray-600">
                Tomaremos 2 fotos: lo que ves y ustedes
              </p>
            </div>
            <Button onClick={handleStartCapture} size="lg">
              Comenzar
            </Button>
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

            <Input
              placeholder="Escribe un caption (opcional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />

            {location && (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                📍 Ubicación guardada
              </p>
            )}

            <Button onClick={handleSave} className="w-full" size="lg">
              Guardar recuerdo 💕
            </Button>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
