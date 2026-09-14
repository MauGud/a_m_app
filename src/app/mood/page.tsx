'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth-store';
import { useMoodStore } from '@/stores/mood-store';
import { cn, MOOD_CONFIG, getMoodEmoji, formatDate } from '@/lib/utils';

type MoodValue = 1 | 2 | 3 | 4 | 5;

export default function MoodPage() {
  const { memberSlot, partnerName } = useAuthStore();
  const { upsertMood, getTodayMood, getPartnerTodayMood, getRecentMoods } = useMoodStore();

  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [saved, setSaved] = useState(false);

  const myMood = memberSlot ? getTodayMood(memberSlot) : undefined;
  const partnerMood = memberSlot ? getPartnerTodayMood(memberSlot) : undefined;
  const recentMoods = memberSlot ? getRecentMoods(memberSlot, 7) : [];

  useEffect(() => {
    if (myMood) {
      setSelectedMood(myMood.value);
      setNote(myMood.note || '');
    }
  }, [myMood]);

  const handleMoodSelect = (value: MoodValue) => {
    setSelectedMood(value);
    if (memberSlot) {
      upsertMood(memberSlot, value, note || undefined);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSaveNote = () => {
    if (memberSlot && selectedMood) {
      upsertMood(memberSlot, selectedMood, note || undefined);
      setShowNote(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <AppLayout title="Mood">
      <div className="page-container space-y-6">
        {/* Today's mood selection */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-center mb-4">
            ¿Cómo te sientes hoy?
          </h3>
          
          <div className="flex justify-center gap-3 mb-4">
            {([1, 2, 3, 4, 5] as MoodValue[]).map((value) => {
              const config = MOOD_CONFIG[value];
              return (
                <button
                  key={value}
                  onClick={() => handleMoodSelect(value)}
                  className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all',
                    selectedMood === value
                      ? `${config.color} ring-2 ring-offset-2 ring-gray-400 scale-110`
                      : 'bg-gray-100 hover:bg-gray-200'
                  )}
                >
                  {config.emoji}
                </button>
              );
            })}
          </div>

          {selectedMood && (
            <p className="text-center text-gray-600 mb-4">
              {MOOD_CONFIG[selectedMood].label}
            </p>
          )}

          {saved && (
            <p className="text-center text-pastel-green-400 text-sm mb-4">
              ✓ Mood guardado
            </p>
          )}

          {/* Note section */}
          {!showNote ? (
            <Button
              variant="ghost"
              onClick={() => setShowNote(true)}
              className="w-full"
              disabled={!selectedMood}
            >
              {note ? '✏️ Editar nota' : '+ Agregar nota'}
            </Button>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="¿Quieres contar algo más?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowNote(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSaveNote} className="flex-1">
                  Guardar nota
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Partner's mood */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">
            ¿Cómo está {partnerName}?
          </h3>
          {partnerMood ? (
            <div className="flex items-center gap-4">
              <span className="text-4xl">{getMoodEmoji(partnerMood.value)}</span>
              <div>
                <p className="font-medium">{MOOD_CONFIG[partnerMood.value as MoodValue].label}</p>
                {partnerMood.note && (
                  <p className="text-sm text-gray-600 mt-1">{partnerMood.note}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Aún no ha registrado su mood</p>
          )}
        </Card>

        {/* Recent history */}
        {recentMoods.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Últimos 7 días</h3>
            <div className="space-y-2">
              {recentMoods.map((mood) => (
                <div
                  key={mood.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-gray-600">
                    {formatDate(mood.date)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getMoodEmoji(mood.value)}</span>
                    {mood.note && (
                      <span className="text-xs text-gray-400">📝</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
