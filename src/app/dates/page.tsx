'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { SectionIntro } from '@/components/ui/section-intro';
import { useAuthStore } from '@/stores/auth-store';
import { useActivitiesStore, type Activity } from '@/stores/activities-store';
import { EMPTY_DATE_EXTRA, useDateExtraStore, type DateExtra } from '@/stores/date-extra-store';
import { useUsageStore } from '@/stores/usage-store';
import { useMemoriesStore } from '@/stores/memories-store';
import { cn, getTodayISO } from '@/lib/utils';
import {
  CDMX_CENTER,
  DATE_DISTANCES,
  DATE_DURATIONS,
  DATE_IDEAS,
  DATE_MOMENTS,
  DATE_MOODS,
  DATE_REGIONS,
  DATE_SUBCATEGORIES,
  PRICE_BANDS,
  currentMoment,
  filterDateIdeas,
  formatPriceRange,
  haversineKm,
  recommendToday,
  searchHint,
  type DateDistance,
  type DateDuration,
  type DateIdea,
  type DateMoment,
  type DateMood,
  type PriceBand,
} from '@/lib/date-ideas';
import {
  DATE_LIST_LIMIT,
  DATE_RESCHEDULE_LIMIT,
  DATE_WINDOW_MONTHS,
  canAddDateToList,
  remainingListSlots,
} from '@/lib/date-rules';
import { zipFiles, dataUrlToBytes } from '@/lib/zip';
import { ensureNotificationPermission } from '@/lib/notifications';

type Tab = 'explorar' | 'lista' | 'juntos' | 'amanda';

function formatDateLabel(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`);
  const today = getTodayISO();
  if (dateStr === today) return 'Hoy';
  return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

function DatesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { memberSlot } = useAuthStore();
  const activities = useActivitiesStore((s) => s.activities);
  const addActivity = useActivitiesStore((s) => s.addActivity);
  const updateActivity = useActivitiesStore((s) => s.updateActivity);
  const completeActivity = useActivitiesStore((s) => s.completeActivity);
  const deleteActivity = useActivitiesStore((s) => s.deleteActivity);
  const getExtra = useDateExtraStore((s) => s.getExtra);
  const patchExtra = useDateExtraStore((s) => s.patchExtra);
  const track = useUsageStore((s) => s.track);
  const memories = useMemoriesStore((s) => s.memories);
  const isMau = memberSlot === 'MEMBER_B';

  const requestedTab = (searchParams.get('tab') as Tab) || 'explorar';
  const [tab, setTab] = useState<Tab>(requestedTab === 'amanda' ? 'explorar' : requestedTab);

  useEffect(() => {
    const next =
      requestedTab === 'amanda'
        ? isMau
          ? 'amanda'
          : 'explorar'
        : requestedTab === 'lista' || requestedTab === 'juntos' || requestedTab === 'explorar'
          ? requestedTab
          : 'explorar';
    setTab((current) => (current === next ? current : next));
  }, [isMau, requestedTab]);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<string | 'todas'>('todas');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [band, setBand] = useState<PriceBand | 'todas'>('todas');
  const [mood, setMood] = useState<DateMood | 'todas'>('todas');
  const [moment, setMoment] = useState<DateMoment | 'todas'>('todas');
  const [duration, setDuration] = useState<DateDuration | 'todas'>('todas');
  const [distance, setDistance] = useState<DateDistance | 'todas'>('todas');
  const [maxPrice, setMaxPrice] = useState('');
  const [veganOnly, setVeganOnly] = useState(false);
  const [weekdayNight, setWeekdayNight] = useState(false);
  const [todayMode, setTodayMode] = useState(false);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'ask' | 'ok' | 'denied'>('idle');
  const [livePlaces, setLivePlaces] = useState<Array<{ label: string; city: string; state: string; country: string }>>([]);
  const [picking, setPicking] = useState<DateIdea | null>(null);
  const [dueDate, setDueDate] = useState(getTodayISO());
  const [dueTime, setDueTime] = useState('19:00');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(getTodayISO());
  const [rescheduleTime, setRescheduleTime] = useState('19:00');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [zipStatus, setZipStatus] = useState('');
  const [ideasShown, setIdeasShown] = useState(24);

  const extraOf = (item: Activity): DateExtra => ({
    ...EMPTY_DATE_EXTRA,
    ...(item.extra as Partial<DateExtra> | undefined),
    ...getExtra(item.id),
  });

  const dates = activities.filter((a) => a.category === 'date');
  const pending = dates.filter((a) => a.status === 'pending').sort((a, b) => a.due_date.localeCompare(b.due_date));
  const lived = dates.filter((a) => a.status === 'completed').sort((a, b) => b.due_date.localeCompare(a.due_date));
  const slots = remainingListSlots(dates);

  const filterInput = {
    query,
    kind,
    state: state || undefined,
    city: city || undefined,
    band,
    mood,
    moment,
    duration,
    distance,
    origin: origin || undefined,
    veganOnly,
    weekdayNight,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  };

  const ideas = useMemo(
    () => (todayMode ? recommendToday(filterInput) : filterDateIdeas(filterInput)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, kind, state, city, band, mood, moment, duration, distance, origin, veganOnly, weekdayNight, maxPrice, todayMode]
  );

  useEffect(() => {
    track(memberSlot, 'dates', tab);
  }, [tab, memberSlot, track]);

  useEffect(() => {
    setIdeasShown(24);
  }, [query, kind, state, city, band, mood, moment, duration, distance, veganOnly, weekdayNight, maxPrice, todayMode]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setLivePlaces([]);
      return undefined;
    }
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as { places: typeof livePlaces };
        setLivePlaces(data.places || []);
      } catch {
        setLivePlaces([]);
      }
    }, 400);
    return () => window.clearTimeout(handle);
  }, [query]);

  const selectTab = (next: Tab) => {
    setTab(next);
    window.history.replaceState(window.history.state, '', `/dates?tab=${next}`);
  };

  const startFromIdea = (idea: DateIdea) => {
    setPicking(idea);
    setNote(idea.blurb);
    setFormError('');
    setDueDate(getTodayISO());
    setDueTime(idea.momentos.includes('Noche') ? '19:00' : idea.momentos.includes('Mañana') ? '10:00' : '16:00');
    selectTab('lista');
  };

  const askLocation = () => {
    setGeoStatus('ask');
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      setOrigin(CDMX_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('ok');
      },
      () => {
        setGeoStatus('denied');
        setOrigin(CDMX_CENTER);
      },
      { timeout: 8000, maximumAge: 60_000 }
    );
  };

  const saveDate = async () => {
    if (!memberSlot || !picking) return;
    if (!dueDate) {
      setFormError('La fecha es obligatoria.');
      return;
    }
    if (!canAddDateToList(dates, dueDate)) {
      setFormError(`En la lista caben ${DATE_LIST_LIMIT} citas en ${DATE_WINDOW_MONTHS} meses. Muevan una o esperen.`);
      return;
    }
    const extra: DateExtra = {
      ideaId: picking.id,
      city: picking.city,
      state: picking.state,
      country: picking.country,
      priceMxn: picking.priceMxn,
      rescheduleCount: 0,
      remindersSent: [],
      photoNudges: 0,
    };
    const created = await addActivity({
      title: picking.title,
      description: note.trim() || picking.blurb,
      category: 'date',
      due_date: dueDate,
      due_time: dueTime || '19:00',
      assigned_to: undefined,
      created_by: memberSlot,
      recurring: 'none',
      recurring_interval: 1,
      recurring_unit: 'day',
      extra,
    });
    patchExtra(created.id, extra);
    track(memberSlot, 'huella', `date:${picking.title}`);
    setPicking(null);
    setNote('');
    setFormError('');
    void ensureNotificationPermission();
  };

  const reschedule = async (activity: Activity) => {
    const extra = extraOf(activity);
    if (extra.rescheduleCount >= DATE_RESCHEDULE_LIMIT) {
      setFormError('Esta fecha ya se negoció 3 veces. Así se queda.');
      return;
    }
    const nextExtra = { ...extraOf(activity), rescheduleCount: extra.rescheduleCount + 1 };
    await updateActivity(activity.id, {
      due_date: rescheduleDate,
      due_time: rescheduleTime,
      extra: nextExtra,
    });
    patchExtra(activity.id, nextExtra);
    setRescheduleId(null);
    track(memberSlot, 'huella', `reprogramar:${activity.title}`);
  };

  const goToMemory = (activity: Activity) => {
    const params = new URLSearchParams({
      dateId: activity.id,
      title: activity.title,
      description: activity.description || '',
    });
    router.push(`/recuerdos/nuevo?${params.toString()}`);
  };

  const shareInstagram = async (activity: Activity) => {
    const extra = getExtra(activity.id);
    const memory = memories.find((m) => m.id === extra.memoryId) || memories[0];
    const text = `${activity.title}\n${activity.description || ''}\n#AyM`;
    try {
      if (navigator.share) {
        await navigator.share({ title: activity.title, text });
      } else {
        window.open('https://www.instagram.com/', '_blank', 'noopener');
      }
      track(memberSlot, 'huella', 'instagram');
    } catch {
      window.open('https://www.instagram.com/', '_blank', 'noopener');
    }
    void memory;
  };

  const sendZip = async () => {
    if (!isMau) return;
    const chosen = memories.filter((m) => selectedPhotos.includes(m.id));
    if (chosen.length === 0) {
      setZipStatus('Elige al menos una foto.');
      return;
    }
    setZipStatus('Armando el zip…');
    try {
      const files = [];
      for (const memory of chosen) {
        files.push({ name: `${memory.id}-lugar.jpg`, data: await dataUrlToBytes(memory.image_back) });
        files.push({ name: `${memory.id}-nosotros.jpg`, data: await dataUrlToBytes(memory.image_front) });
      }
      const blob = await zipFiles(files);
      const file = new File([blob], 'recuerdos-aym.zip', { type: 'application/zip' });
      const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Recuerdos A & M',
          text: 'Para mau@nexcar.mx',
        });
        setZipStatus('Listo. Envíalo a mau@nexcar.mx desde la hoja de compartir.');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recuerdos-aym.zip';
        a.click();
        URL.revokeObjectURL(url);
        window.location.href = 'mailto:mau@nexcar.mx?subject=Recuerdos%20A%20%26%20M&body=Va%20el%20zip%20de%20fotos%20que%20bajé%20de%20la%20app.';
        setZipStatus('Se descargó el zip. Adjúntalo al correo mau@nexcar.mx.');
      }
    } catch (err) {
      console.warn(err);
      setZipStatus('No se pudo armar el zip. Intenta de nuevo.');
    }
  };

  return (
    <AppLayout title="Dates">
      <div className="page-container space-y-4">
        <SectionIntro emoji="💕" title="500 citas reales">
          Catálogo C0001 a C0500 para CDMX y destinos a máximo 3 horas. En la lista caben {DATE_LIST_LIMIT} citas
          cada {DATE_WINDOW_MONTHS} meses. La fecha se pacta y solo se puede negociar 3 veces.
        </SectionIntro>

        <div className="flex gap-1 overflow-x-auto bg-gray-100 rounded-2xl p-1">
          {([
            ['explorar', 'Explorar'],
            ['lista', `En la lista (${pending.length})`],
            ['juntos', `Ya juntos (${lived.length})`],
            ...(isMau ? ([['amanda', 'Amanda']] as const) : []),
          ] as Array<[Tab, string]>).map(([id, label]) => (
            <button
              key={id}
              onClick={() => selectTab(id)}
              className={cn(
                'flex-1 min-w-[7rem] px-3 py-2 rounded-xl text-xs font-medium',
                tab === id ? 'bg-pastel-pink-100 text-gray-800' : 'text-gray-500'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'explorar' && (
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => {
                setTodayMode(true);
                setMoment(currentMoment());
                if (!origin) askLocation();
              }}
            >
              Qué hacemos hoy
            </Button>
            {geoStatus === 'ask' && (
              <p className="text-xs text-gray-500">
                Pedimos tu ubicación solo para medir distancia a pie, cerca, en la ciudad o escapada. Si la niegas,
                usamos el centro de CDMX.
              </p>
            )}
            <Input
              value={query}
              onChange={(e) => {
                setTodayMode(false);
                setQuery(e.target.value);
              }}
              placeholder="Busca: Condesa, picnic, vegano, menos de 400"
            />
            {livePlaces.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {livePlaces.map((place) => (
                  <button
                    key={place.label}
                    onClick={() => {
                      setCity(place.city);
                      setState(place.state.includes('México') ? 'Ciudad de México' : place.state);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-white border border-pastel-pink-100"
                  >
                    📍 {place.city || place.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DATE_SUBCATEGORIES.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setKind(kind === item.value ? 'todas' : item.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs whitespace-nowrap',
                    kind === item.value ? 'bg-pastel-pink-100' : 'bg-white border border-gray-100'
                  )}
                >
                  {item.emoji} {item.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DATE_MOODS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setMood(mood === item.value ? 'todas' : item.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs whitespace-nowrap',
                    mood === item.value ? 'bg-pastel-pink-100' : 'bg-white border border-gray-100'
                  )}
                >
                  {item.emoji} {item.value}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DATE_MOMENTS.map((item) => (
                <button
                  key={item}
                  onClick={() => setMoment(moment === item ? 'todas' : item)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs whitespace-nowrap',
                    moment === item ? 'bg-pastel-pink-100' : 'bg-white border border-gray-100'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DATE_DISTANCES.map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    setDistance(distance === item.value ? 'todas' : item.value);
                    if (!origin) askLocation();
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs whitespace-nowrap',
                    distance === item.value ? 'bg-pastel-pink-100' : 'bg-white border border-gray-100'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-xl border border-pastel-pink-100 bg-white px-3 py-2 text-sm"
              >
                <option value="">Toda la región</option>
                {DATE_REGIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Zona o colonia" />
              <select
                value={band}
                onChange={(e) => setBand(e.target.value as PriceBand | 'todas')}
                className="rounded-xl border border-pastel-pink-100 bg-white px-3 py-2 text-sm"
              >
                <option value="todas">Cualquier precio</option>
                {PRICE_BANDS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as DateDuration | 'todas')}
                className="rounded-xl border border-pastel-pink-100 bg-white px-3 py-2 text-sm"
              >
                <option value="todas">Cualquier duración</option>
                {DATE_DURATIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Tengo X pesos (pareja)"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setVeganOnly((v) => !v)}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-medium',
                  veganOnly ? 'bg-pastel-pink-100' : 'bg-gray-100'
                )}
              >
                Con opción vegana
              </button>
              <button
                onClick={() => setWeekdayNight((v) => !v)}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-medium',
                  weekdayNight ? 'bg-pastel-pink-100' : 'bg-gray-100'
                )}
              >
                Martes a jueves noche
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {todayMode ? 'Para hoy · ' : ''}
              {ideas.length} planes · catálogo {DATE_IDEAS.length} citas (C0001 a C0500)
            </p>
            {searchHint(query, ideas.length) && (
              <p className="text-sm text-gray-600">{searchHint(query, ideas.length)}</p>
            )}
            <div className="space-y-3">
              {ideas.slice(0, ideasShown).map((idea) => {
                const here = origin || CDMX_CENTER;
                const km = haversineKm(here, { lat: idea.lat, lng: idea.lng });
                const sub = DATE_SUBCATEGORIES.find((item) => item.value === idea.kind);
                return (
                  <Card key={idea.id} className="p-4">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">
                          {sub?.emoji} {idea.city}, {idea.state} · {idea.id}
                        </p>
                        <h3 className="font-medium text-gray-800 mt-1">{idea.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{idea.blurb}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatPriceRange(idea)} · {idea.durationHours} h · {km.toFixed(1)} km
                          {idea.vegan !== '-' ? ` · vegano ${idea.vegan}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{idea.moods.join(', ')}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <a
                            href={idea.maps}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-gray-700 underline"
                          >
                            Google Maps
                          </a>
                          {idea.sources[0]?.url && (
                            <a
                              href={idea.sources[0].url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-gray-500 underline"
                            >
                              {idea.sources[0].fuente || 'Fuente'}
                            </a>
                          )}
                        </div>
                      </div>
                      <Button size="sm" className="shrink-0 self-start" onClick={() => startFromIdea(idea)}>
                        A la lista
                      </Button>
                    </div>
                  </Card>
                );
              })}
              {ideas.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">
                  Nada con esos filtros. Quita distancia, presupuesto o el momento del día.
                </p>
              )}
              {ideasShown < ideas.length && (
                <Button variant="ghost" className="w-full" onClick={() => setIdeasShown((n) => n + 24)}>
                  Ver más planes ({ideas.length - ideasShown} restantes)
                </Button>
              )}
            </div>
          </div>
        )}

        {tab === 'lista' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Quedan {slots} lugares en los próximos {DATE_WINDOW_MONTHS} meses.
            </p>
            {picking && (
              <Card className="p-4 space-y-3 border-2 border-pastel-pink-200">
                <h3 className="font-medium">{picking.title}</h3>
                <p className="text-sm text-gray-600">{picking.city}, {picking.state}</p>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Fecha *</label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Hora</label>
                    <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
                  </div>
                </div>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setPicking(null)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={saveDate} disabled={!dueDate}>
                    Pactar date
                  </Button>
                </div>
              </Card>
            )}
            {pending.length === 0 && !picking && (
              <div className="empty-state">
                <p className="text-4xl mb-2">📅</p>
                <p className="text-gray-500">La lista está vacía. Exploren un plan y páctenlo con fecha.</p>
              </div>
            )}
            {pending.map((item) => {
              const extra = extraOf(item);
              return (
                <Card key={item.id} className="p-4 space-y-2">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500">
                        {formatDateLabel(item.due_date)} {item.due_time} · {extra.city || 'por definir'}
                      </p>
                      <h3 className="font-medium text-gray-800">{item.title}</h3>
                      {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Reprogramaciones {extra.rescheduleCount}/{DATE_RESCHEDULE_LIMIT}
                      </p>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm(item.id)}
                      className="text-gray-400 p-2"
                      aria-label={`Quitar ${item.title}`}
                    >
                      ✕
                    </button>
                  </div>
                  {rescheduleId === item.id ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
                      <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
                      <Button size="sm" variant="ghost" onClick={() => setRescheduleId(null)}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={() => reschedule(item)}>
                        Guardar fecha
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={extra.rescheduleCount >= DATE_RESCHEDULE_LIMIT}
                        onClick={() => {
                          setRescheduleId(item.id);
                          setRescheduleDate(item.due_date);
                          setRescheduleTime(item.due_time || '19:00');
                        }}
                      >
                        Negociar fecha
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!memberSlot) return;
                          completeActivity(item.id, memberSlot);
                          goToMemory(item);
                        }}
                      >
                        Ya lo vivimos
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {tab === 'juntos' && (
          <div className="space-y-3">
            {lived.length === 0 && (
              <div className="empty-state">
                <p className="text-4xl mb-2">✨</p>
                <p className="text-gray-500">Cuando marquen un date como vivido, aparece aquí.</p>
              </div>
            )}
            {lived.map((item) => {
              const extra = extraOf(item);
              const hasMemory = Boolean(extra.memoryId);
              return (
                <Card key={item.id} className="p-4 space-y-2">
                  <p className="text-xs text-gray-500">{formatDateLabel(item.due_date)}</p>
                  <h3 className="font-medium text-gray-800">{item.title}</h3>
                  {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => goToMemory(item)}>
                      {hasMemory ? 'Ver / sumar foto' : 'Subir foto al recuerdo'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => shareInstagram(item)}>
                      Instagram
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {tab === 'amanda' && isMau && (
          <AmandaDash
            memories={memories}
            selectedPhotos={selectedPhotos}
            setSelectedPhotos={setSelectedPhotos}
            zipStatus={zipStatus}
            sendZip={sendZip}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="¿Quitar de la lista?"
        message="Esta date sale de los 20 lugares de los próximos 3 meses."
        confirmText="Quitar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (deleteConfirm) deleteActivity(deleteConfirm);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}

function AmandaDash({
  memories,
  selectedPhotos,
  setSelectedPhotos,
  zipStatus,
  sendZip,
}: {
  memories: ReturnType<typeof useMemoriesStore.getState>['memories'];
  selectedPhotos: string[];
  setSelectedPhotos: (ids: string[]) => void;
  zipStatus: string;
  sendZip: () => void;
}) {
  const events = useUsageStore((s) => s.events).filter((event) => event.member === 'MEMBER_A');
  const counts = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.kind] = (acc[event.kind] || 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-medium mb-2">Qué usa más Amanda</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay huellas. Se van juntando solas.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {sorted.map(([kind, n]) => (
              <li key={kind} className="flex justify-between">
                <span className="capitalize">{kind}</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="p-4 space-y-2">
        <h3 className="font-medium">Últimas huellas</h3>
        {events.slice(0, 12).map((event) => (
          <p key={event.id} className="text-xs text-gray-600">
            {new Date(event.at).toLocaleString('es-MX')} · {event.kind} · {event.label}
          </p>
        ))}
      </Card>
      <Card className="p-4 space-y-3">
        <h3 className="font-medium">Fotos para mau@nexcar.mx</h3>
        <p className="text-sm text-gray-600">Elige recuerdos y ármalos en un zip listo para el correo.</p>
        <div className="grid grid-cols-3 gap-2">
          {memories.map((memory) => {
            const on = selectedPhotos.includes(memory.id);
            return (
              <button
                key={memory.id}
                onClick={() =>
                  setSelectedPhotos(
                    on ? selectedPhotos.filter((id) => id !== memory.id) : [...selectedPhotos, memory.id]
                  )
                }
                className={cn('relative rounded-xl overflow-hidden border-2', on ? 'border-pastel-pink-300' : 'border-transparent')}
              >
                <img src={memory.image_back} alt="" className="aspect-square object-cover w-full" />
              </button>
            );
          })}
        </div>
        <Button onClick={sendZip} disabled={selectedPhotos.length === 0} className="w-full">
          Armar zip para mau@nexcar.mx
        </Button>
        {zipStatus && <p className="text-sm text-gray-600">{zipStatus}</p>}
      </Card>
    </div>
  );
}

export default function DatesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">💕</div>}>
      <DatesPageInner />
    </Suspense>
  );
}
