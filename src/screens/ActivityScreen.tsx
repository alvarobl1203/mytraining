import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Dumbbell, Loader2, X } from 'lucide-react';
import { useWorkout, type SessionWithSets } from '@/hooks/useWorkout';

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DOW_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function ActivityScreen() {
  const { sessions, loading } = useWorkout();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<SessionWithSets | null>(null);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionWithSets[]> = {};
    sessions.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [sessions]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const days: { date: string | null; dayNum: number | null }[] = [];
    for (let i = 0; i < startOffset; i++) days.push({ date: null, dayNum: null });
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, dayNum: d });
    }
    return days;
  }, [currentMonth]);

  const todayStr = new Date().toISOString().split('T')[0];
  const totalSessions = sessions.length;
  const totalSets = sessions.reduce((sum, s) => sum + s.workout_sets.length, 0);
  const totalVolume = sessions.reduce(
    (sum, s) => sum + s.workout_sets.reduce((ss, set) => ss + set.weight_kg * set.reps, 0),
    0
  );

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  return (
    <div className="pt-2 space-y-4">
      <h2 className="text-xl font-bold text-white">Actividad</h2>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{totalSessions}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Sesiones</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{totalSets}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Series</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{Math.round(totalVolume).toLocaleString('es-ES')}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">kg volumen</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-sm font-bold text-white">
            {MONTHS_ES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button onClick={nextMonth} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DOW_ES.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-zinc-600 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (!day.date) return <div key={idx} className="aspect-square" />;
            const daySessions = sessionsByDate[day.date] || [];
            const hasTrained = daySessions.length > 0;
            const isToday = day.date === todayStr;
            return (
              <button
                key={idx}
                onClick={() => daySessions.length > 0 && setSelectedSession(daySessions[0])}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative ${
                  hasTrained
                    ? 'gradient-brand text-white shadow-glow'
                    : isToday
                    ? 'bg-zinc-800 border border-blue-500/30 text-white'
                    : 'bg-zinc-950/50 text-zinc-600 hover:bg-zinc-800/50'
                }`}
              >
                <span className="text-xs font-semibold">{day.dayNum}</span>
                {hasTrained && <span className="text-[8px] mt-0.5">{daySessions.length}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent sessions list */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">Historial reciente</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-cyan-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-6 text-center">
            <Calendar size={28} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Sin entrenamientos registrados todavia.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 20).map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s)}
                className="w-full text-left bg-zinc-900 border border-zinc-800/50 rounded-2xl p-3 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-white">{s.name || 'Entrenamiento'}</p>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(s.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Dumbbell size={10} /> {s.workout_sets.length} series
                  </span>
                  <span>{s.duration_minutes} min</span>
                  {s.completed && <span className="text-cyan-400">Completado</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Session detail modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center safe-bottom">
          <div className="bg-zinc-900 border border-zinc-800/50 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/50">
              <div>
                <h3 className="text-base font-bold text-white">{selectedSession.name || 'Entrenamiento'}</h3>
                <p className="text-[10px] text-zinc-500">
                  {new Date(selectedSession.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 no-scrollbar">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-950/50 rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-white">{selectedSession.workout_sets.length}</p>
                  <p className="text-[10px] text-zinc-500">Series</p>
                </div>
                <div className="bg-zinc-950/50 rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-white">{selectedSession.duration_minutes}</p>
                  <p className="text-[10px] text-zinc-500">Minutos</p>
                </div>
                <div className="bg-zinc-950/50 rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-white">
                    {Math.round(
                      selectedSession.workout_sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0)
                    ).toLocaleString('es-ES')}
                  </p>
                  <p className="text-[10px] text-zinc-500">kg volumen</p>
                </div>
              </div>

              {(() => {
                const grouped: Record<string, typeof selectedSession.workout_sets> = {};
                selectedSession.workout_sets.forEach((s) => {
                  if (!grouped[s.exercise_id]) grouped[s.exercise_id] = [];
                  grouped[s.exercise_id].push(s);
                });
                return Object.entries(grouped).map(([exId, sets]) => (
                  <div key={exId} className="bg-zinc-950/50 border border-zinc-800/30 rounded-xl p-3">
                    <h4 className="text-sm font-semibold text-white mb-2">{sets[0].exercises.name}</h4>
                    <div className="space-y-1">
                      {sets.map((s, idx) => (
                        <div key={s.id} className="flex items-center gap-2 text-xs">
                          <span className="text-[10px] font-bold text-zinc-600 w-5">{idx + 1}</span>
                          <span className="text-white font-medium flex-1">
                            {s.weight_kg} kg x {s.reps}
                          </span>
                          {s.rir > 0 && <span className="text-[10px] text-zinc-500">RIR {s.rir}</span>}
                          {s.technique !== 'Normal' && (
                            <span className="text-[10px] text-blue-400">{s.technique}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
