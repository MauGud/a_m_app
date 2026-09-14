'use client';

import { useState, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { useSparkStore } from '@/stores/spark-store';
import { cn } from '@/lib/utils';

export default function SparkPage() {
  const { memberSlot, displayName, partnerName } = useAuthStore();
  const { getTodaySpark, triggerSpark, submitSpark, hasSubmitted } = useSparkStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const todaySpark = getTodaySpark();
  const alreadySubmitted = memberSlot ? hasSubmitted(memberSlot) : false;

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
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

  const handleStartSpark = () => {
    triggerSpark();
  };

  const handleOpenCamera = async () => {
    setIsCapturing(true);
    await startCamera();
  };

  const handleCapture = () => {
    const photo = capturePhoto();
    if (photo) {
      setCapturedImage(photo);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleSubmit = () => {
    if (capturedImage && memberSlot) {
      submitSpark(memberSlot, capturedImage);
      setCapturedImage(null);
      setIsCapturing(false);
    }
  };

  const getMySubmission = () => {
    return todaySpark?.submissions.find(s => s.member === memberSlot);
  };

  const getPartnerSubmission = () => {
    const partnerSlot = memberSlot === 'MEMBER_A' ? 'MEMBER_B' : 'MEMBER_A';
    return todaySpark?.submissions.find(s => s.member === partnerSlot);
  };

  return (
    <AppLayout title="Spark">
      <div className="page-container">
        {/* No spark started */}
        {!todaySpark && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-8">
              <span className="text-6xl mb-4 block">💕</span>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Spark del día
              </h2>
              <p className="text-gray-600 max-w-xs">
                Tómense una foto al mismo tiempo sin ver la del otro hasta que ambos envíen
              </p>
            </div>
            <Button onClick={handleStartSpark} size="lg">
              Iniciar Spark 💕
            </Button>
          </div>
        )}

        {/* Spark waiting for submissions */}
        {todaySpark && todaySpark.status !== 'revealed' && !isCapturing && (
          <div className="space-y-6">
            <Card className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">Spark activo</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* My status */}
                <div className={cn(
                  'p-4 rounded-xl',
                  alreadySubmitted ? 'bg-pastel-green-100' : 'bg-gray-100'
                )}>
                  <p className="text-sm text-gray-600 mb-2">{displayName}</p>
                  {alreadySubmitted ? (
                    <>
                      <span className="text-3xl">✅</span>
                      <p className="text-xs text-gray-500 mt-1">Enviado</p>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl">⏳</span>
                      <p className="text-xs text-gray-500 mt-1">Pendiente</p>
                    </>
                  )}
                </div>

                {/* Partner status */}
                <div className={cn(
                  'p-4 rounded-xl',
                  getPartnerSubmission() ? 'bg-pastel-green-100' : 'bg-gray-100'
                )}>
                  <p className="text-sm text-gray-600 mb-2">{partnerName}</p>
                  {getPartnerSubmission() ? (
                    <>
                      <span className="text-3xl">✅</span>
                      <p className="text-xs text-gray-500 mt-1">Enviado</p>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl">⏳</span>
                      <p className="text-xs text-gray-500 mt-1">Pendiente</p>
                    </>
                  )}
                </div>
              </div>

              {!alreadySubmitted && (
                <Button onClick={handleOpenCamera} size="lg" className="w-full">
                  Tomar mi foto 📸
                </Button>
              )}

              {alreadySubmitted && !getPartnerSubmission() && (
                <p className="text-gray-500">
                  Esperando a que {partnerName} envíe su foto...
                </p>
              )}
            </Card>
          </div>
        )}

        {/* Camera view */}
        {isCapturing && !capturedImage && (
          <div className="space-y-4">
            <div className="relative aspect-square bg-black rounded-2xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>
            <div className="text-center">
              <Button
                onClick={handleCapture}
                size="lg"
                className="w-20 h-20 rounded-full"
              >
                📸
              </Button>
            </div>
          </div>
        )}

        {/* Preview */}
        {isCapturing && capturedImage && (
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img
                src={capturedImage}
                alt="Preview"
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleRetake} className="flex-1">
                Volver a tomar
              </Button>
              <Button onClick={handleSubmit} className="flex-1">
                Enviar 💕
              </Button>
            </div>
          </div>
        )}

        {/* Revealed */}
        {todaySpark && todaySpark.status === 'revealed' && (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-4xl">🎉</span>
              <h2 className="text-xl font-semibold mt-2">¡Spark revelado!</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* My photo */}
              <div>
                <p className="text-sm text-gray-600 text-center mb-2">{displayName}</p>
                {getMySubmission() && (
                  <img
                    src={getMySubmission()!.image}
                    alt=""
                    className="w-full aspect-square object-cover rounded-xl scale-x-[-1]"
                  />
                )}
              </div>

              {/* Partner photo */}
              <div>
                <p className="text-sm text-gray-600 text-center mb-2">{partnerName}</p>
                {getPartnerSubmission() && (
                  <img
                    src={getPartnerSubmission()!.image}
                    alt=""
                    className="w-full aspect-square object-cover rounded-xl scale-x-[-1]"
                  />
                )}
              </div>
            </div>

            <Card className="p-4 bg-pastel-pink-50 text-center">
              <p className="text-gray-600">
                💕 Vuelve mañana para un nuevo Spark
              </p>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
