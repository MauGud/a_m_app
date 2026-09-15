'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionIntro } from '@/components/ui/section-intro';
import { useAuthStore } from '@/stores/auth-store';
import { useSparkStore } from '@/stores/spark-store';
import { cn } from '@/lib/utils';
import { useUserMedia } from '@/lib/use-user-media';

export default function SparkPage() {
  const { memberSlot, displayName, partnerName } = useAuthStore();
  const sparks = useSparkStore((s) => s.sparks);
  const getTodaySpark = useSparkStore((s) => s.getTodaySpark);
  const triggerSpark = useSparkStore((s) => s.triggerSpark);
  const submitSpark = useSparkStore((s) => s.submitSpark);
  const hasSubmitted = useSparkStore((s) => s.hasSubmitted);
  const fetchFromSupabase = useSparkStore((s) => s.fetchFromSupabase);

  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { videoRef, capturePhoto, error } = useUserMedia(isCapturing && !capturedImage, 'user');

  const todaySpark = getTodaySpark();
  const alreadySubmitted = memberSlot ? hasSubmitted(memberSlot) : false;

  useEffect(() => {
    fetchFromSupabase();
    const waiting = todaySpark && todaySpark.status !== 'revealed';
    if (!waiting) return undefined;
    const interval = setInterval(() => {
      fetchFromSupabase();
    }, 3000);
    return () => clearInterval(interval);
    // todaySpark identity changes every fetch; status/length are the triggers we care about.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFromSupabase, todaySpark?.status, sparks.length]);

  const handleStartSpark = () => {
    triggerSpark();
  };

  const handleOpenCamera = () => {
    setIsCapturing(true);
  };

  const handleCapture = () => {
    const photo = capturePhoto();
    if (photo) {
      setCapturedImage(photo);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleSubmit = () => {
    if (capturedImage && memberSlot) {
      submitSpark(memberSlot, capturedImage);
      setCapturedImage(null);
      setIsCapturing(false);
    }
  };

  const getMySubmission = () => {
    return todaySpark?.submissions.find((s) => s.member === memberSlot);
  };

  const getPartnerSubmission = () => {
    const partnerSlot = memberSlot === 'MEMBER_A' ? 'MEMBER_B' : 'MEMBER_A';
    return todaySpark?.submissions.find((s) => s.member === partnerSlot);
  };

  return (
    <AppLayout title="Spark">
      <div className="page-container space-y-6">
        <SectionIntro emoji="✨" title="La foto del mismo instante">
          Tómense una foto al mismo tiempo, sin ver la del otro. Cuando ambos envían, se revelan
          juntas. Así nace la magia del día, aunque estén lejos.
        </SectionIntro>

        {!todaySpark && (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <div className="text-center mb-8">
              <span className="text-6xl mb-4 block">💕</span>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Spark del día
              </h2>
              <p className="text-gray-600 max-w-xs mx-auto">
                Cuando uno inicia, el otro lo ve en tiempo real. Nadie ve la foto hasta que los dos envíen.
              </p>
            </div>
            <Button onClick={handleStartSpark} size="lg">
              Iniciar Spark 💕
            </Button>
          </div>
        )}

        {todaySpark && todaySpark.status !== 'revealed' && !isCapturing && (
          <div className="space-y-6">
            <Card className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">Spark activo</h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div
                  className={cn(
                    'p-4 rounded-xl',
                    alreadySubmitted ? 'bg-pastel-green-100' : 'bg-gray-100'
                  )}
                >
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

                <div
                  className={cn(
                    'p-4 rounded-xl',
                    getPartnerSubmission() ? 'bg-pastel-green-100' : 'bg-gray-100'
                  )}
                >
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
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <p className="text-white text-center p-4">{error}</p>
                </div>
              )}
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

        {todaySpark && todaySpark.status === 'revealed' && (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-4xl">🎉</span>
              <h2 className="text-xl font-semibold mt-2">¡Spark revelado!</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
