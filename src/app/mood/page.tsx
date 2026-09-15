'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { SectionIntro } from '@/components/ui/section-intro';
import { useAuthStore } from '@/stores/auth-store';
import { useMoodStore } from '@/stores/mood-store';
import { cn, MOOD_CONFIG, getMoodEmoji, formatDate } from '@/lib/utils';
import { MEMBER_NAMES, MOOD_RETENTION_DAYS } from '@/lib/constants';

type MoodValue = 1 | 2 | 3 | 4 | 5;

export default function MoodPage() {
  const { memberSlot } = useAuthStore();
  const partnerName = memberSlot === 'MEMBER_A' ? MEMBER_NAMES.MEMBER_B : MEMBER_NAMES.MEMBER_A;
  const moods = useMoodStore((s) => s.moods);
  const upsertMood = useMoodStore((s) => s.upsertMood);
  const getTodayMood = useMoodStore((s) => s.getTodayMood);
  const getPartnerTodayMood = useMoodStore((s) => s.getPartnerTodayMood);
  const getRecentMoods = useMoodStore((s) => s.getRecentMoods);

  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const myMood = memberSlot ? getTodayMood(memberSlot) : undefined;
  const partnerMood = memberSlot ? getPartnerTodayMood(memberSlot) : undefined;
  const recentMoods = memberSlot ? getRecentMoods(memberSlot, MOOD_RETENTION_DAYS) : [];

  useEffect(() => {
    if (myMood) {
      setSelectedMood(myMood.value);
      setNote(myMood.note || '');
    }
  }, [myMood, moods]);

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
        <SectionIntro emoji="😊" title="Cómo se sienten hoy">
          Registren su ánimo y déjense una nota. El historial se guarda un mes y luego se deja ir,
          para vivir el presente juntos.
        </SectionIntro>

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

        {recentMoods.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Último mes</h3>
            <div className="space-y-2">
              {recentMoods.map((mood) => (
                <div
                  key={mood.id}
                  className="py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {formatDate(mood.date)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getMoodEmoji(mood.value)}</span>
                      {mood.note && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedNoteId(expandedNoteId === mood.id ? null : mood.id)
                          }
                          className="text-xs"
                          aria-label="Ver nota"
                        >
                          📝
                        </button>
                      )}
                    </div>
                  </div>
                  {expandedNoteId === mood.id && mood.note && (
                    <p className="text-sm text-gray-600 mt-2 bg-pastel-pink-50 rounded-lg p-2">
                      {mood.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
