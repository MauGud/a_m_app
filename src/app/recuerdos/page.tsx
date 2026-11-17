'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionIntro } from '@/components/ui/section-intro';
import { useMemoriesStore } from '@/stores/memories-store';
import { isFixtureCaption, isRemoteMediaUrl } from '@/lib/fixtures';
import { formatDate, formatDateTime } from '@/lib/utils';
import { mapsUrl } from '@/lib/geo';

export default function RecuerdosPage() {
  const memories = useMemoriesStore((s) => s.memories).filter(
    (memory) =>
      !isFixtureCaption(memory.caption) &&
      isRemoteMediaUrl(memory.image_front) &&
      isRemoteMediaUrl(memory.image_back)
  );
  const deleteMemory = useMemoriesStore((s) => s.deleteMemory);
  const sorted = [...memories].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedMemory = sorted.find((m) => m.id === selectedId);

  return (
    <AppLayout title="Recuerdos">
      <div className="page-container space-y-6">
        <SectionIntro emoji="📸" title="Su álbum a dos cámaras">
          Cada recuerdo guarda la fecha y el lugar. Las fotos de esta sección también viven en la
          galería del teléfono, para que el instante no se quede solo aquí.
        </SectionIntro>

        <div className="text-center">
          <Link href="/recuerdos/nuevo">
            <Button>Capturar recuerdo</Button>
          </Link>
        </div>

        {sorted.length === 0 ? (
          <div className="empty-state min-h-[40vh]">
            <span className="text-6xl mb-4">📷</span>
            <p className="text-gray-500 mb-2">No hay recuerdos aún</p>
            <p className="text-sm text-gray-400">
              Capturen su primer momento juntos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sorted.map((memory) => (
              <button
                key={memory.id}
                onClick={() => setSelectedId(memory.id)}
                className="relative aspect-square rounded-xl overflow-hidden group text-left"
              >
                <img
                  src={memory.image_back}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-xs truncate">
                      {formatDate(memory.created_at)}
                    </p>
                    {memory.location?.address && (
                      <p className="text-white/80 text-[10px] truncate">
                        📍 {memory.location.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="absolute top-2 right-2 w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-sm">
                  <img
                    src={memory.image_front}
                    alt=""
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedMemory && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedId(null)}
          >
            <Card
              className="w-full max-w-md max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Lo que vieron</p>
                    <img
                      src={selectedMemory.image_back}
                      alt=""
                      className="w-full aspect-[3/4] object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ustedes</p>
                    <img
                      src={selectedMemory.image_front}
                      alt=""
                      className="w-full aspect-[3/4] object-cover rounded-lg scale-x-[-1]"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    📅 {formatDateTime(selectedMemory.created_at)}
                  </p>
                  {selectedMemory.caption && (
                    <p className="text-gray-800 mt-2">{selectedMemory.caption}</p>
                  )}
                  {selectedMemory.location && (
                    <a
                      href={mapsUrl(selectedMemory.location.latitude, selectedMemory.location.longitude)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-pastel-blue-400 mt-2 flex items-center gap-1 hover:underline"
                    >
                      📍 {selectedMemory.location.address ||
                        `${selectedMemory.location.latitude.toFixed(4)}, ${selectedMemory.location.longitude.toFixed(4)}`}
                    </a>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={async () => {
                      const text = selectedMemory.caption || 'Un recuerdo de A & M';
                      try {
                        if (navigator.share) {
                          await navigator.share({ title: 'A & M', text });
                        } else if (navigator.clipboard?.writeText) {
                          await navigator.clipboard.writeText(text);
                        }
                      } catch {
                        // share cancelled
                      }
                    }}
                  >
                    Compartir
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedId(null)}
                    className="flex-1"
                  >
                    Cerrar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      deleteMemory(selectedMemory.id);
                      setSelectedId(null);
                    }}
                    className="flex-1"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
