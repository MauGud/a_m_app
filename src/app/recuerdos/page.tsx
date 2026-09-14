'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMemoriesStore } from '@/stores/memories-store';
import { formatDate } from '@/lib/utils';

export default function RecuerdosPage() {
  const { getMemories, deleteMemory } = useMemoriesStore();
  const memories = getMemories();
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedMemory = memories.find((m) => m.id === selectedId);

  return (
    <AppLayout title="Recuerdos">
      <div className="page-container">
        {memories.length === 0 ? (
          <div className="empty-state min-h-[60vh]">
            <span className="text-6xl mb-4">📷</span>
            <p className="text-gray-500 mb-2">No hay recuerdos aún</p>
            <p className="text-sm text-gray-400 mb-6">
              Capturen su primer momento juntos
            </p>
            <Link href="/camara">
              <Button>Crear recuerdo</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Gallery Grid */}
            <div className="grid grid-cols-2 gap-3">
              {memories.map((memory) => (
                <button
                  key={memory.id}
                  onClick={() => setSelectedId(memory.id)}
                  className="relative aspect-square rounded-xl overflow-hidden group"
                >
                  <img
                    src={memory.image_back}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs truncate">
                        {memory.caption || formatDate(memory.created_at)}
                      </p>
                    </div>
                  </div>
                  {/* Small front image overlay */}
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

            {/* Add more button */}
            <div className="mt-6 text-center">
              <Link href="/camara">
                <Button variant="secondary">+ Nuevo recuerdo</Button>
              </Link>
            </div>
          </>
        )}

        {/* Detail Modal */}
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
                {/* Images */}
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

                {/* Details */}
                <div>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedMemory.created_at)}
                  </p>
                  {selectedMemory.caption && (
                    <p className="text-gray-800 mt-2">{selectedMemory.caption}</p>
                  )}
                  {selectedMemory.location && (
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                      📍 {selectedMemory.location.latitude.toFixed(4)}, {selectedMemory.location.longitude.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
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
