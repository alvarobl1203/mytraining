import { useMemo } from 'react';
import { BarChart2, Loader2, TrendingUp, Dumbbell, Calendar } from 'lucide-react';
import { useWorkout } from '@/hooks/useWorkout';
import type { WorkoutSetWithExercise } from '@/types/routine';

function calc1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (36 / (37 - reps)));
}

export default function ProgressScreen() {
  const { sessions, loading } = useWorkout();

  const weeklyVolume = useMemo(() => {
    const weeks: { label: string; volume: number; sets: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7 - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const weekSessions = sessions.filter((s) => {
        const d = new Date(s.date);
        return d >= weekStart && d <= weekEnd;
      });
      const volume = weekSessions.reduce(
        (sum, s) => sum + s.workout_sets.reduce((ss, set) => ss + set.weight_kg * set.reps, 0),
        0
      );
      const sets = weekSessions.reduce((sum, s) => sum + s.workout_sets.length, 0);
      weeks.push({
        label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        volume: Math.round(volume),
        sets,
      });
    }
    return weeks;
  }, [sessions]);

  const topExercises1RM = useMemo(() => {
    const allSets: WorkoutSetWithExercise[] = [];
    sessions.forEach((s) => s.workout_sets.forEach((set) => allSets.push(set)));
    const byExercise: Record<string, WorkoutSetWithExercise[]> = {};
    allSets.forEach((s) => {
      const key = s.exercises.name;
      if (!byExercise[key]) byExercise[key] = [];
      byExercise[key].push(s);
    });
    return Object.entries(byExercise)
      .map(([name, sets]) => {
        const best1RM = Math.max(...sets.map((s) => calc1RM(s.weight_kg, s.reps)));
        const bestSet = sets.find((s) => calc1RM(s.weight_kg, s.reps) === best1RM);
        return {
          name,
          best1RM,
          bestWeight: bestSet?.weight_kg || 0,
          bestReps: bestSet?.reps || 0,
          totalSets: sets.length,
        };
      })
      .sort((a, b) => b.best1RM - a.best1RM)
      .slice(0, 8);
  }, [sessions]);

  const muscleDistribution = useMemo(() => {
    const allSets: WorkoutSetWithExercise[] = [];
    sessions.forEach((s) => s.workout_sets.forEach((set) => allSets.push(set)));
    const byMuscle: Record<string, number> = {};
    allSets.forEach((s) => {
      const m = s.exercises.primary_muscle;
      byMuscle[m] = (byMuscle[m] || 0) + 1;
    });
    return Object.entries(byMuscle)
      .map(([muscle, sets]) => ({ muscle, sets }))
      .sort((a, b) => b.sets - a.sets);
  }, [sessions]);

  const totalVolume = sessions.reduce(
    (sum, s) => sum + s.workout_sets.reduce((ss, set) => ss + set.weight_kg * set.reps, 0),
    0
  );
  const totalSets = sessions.reduce((sum, s) => sum + s.workout_sets.length, 0);
  const totalSessions = sessions.length;

  const maxWeeklyVolume = Math.max(...weeklyVolume.map((w) => w.volume), 1);
  const maxMuscleSets = Math.max(...muscleDistribution.map((m) => m.sets), 1);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (totalSessions === 0) {
    return (
      <div className="pt-2 space-y-4">
        <h2 className="text-xl font-bold text-white">Progreso</h2>
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-6 text-center">
          <BarChart2 size={28} className="text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">
            Aun no hay datos. Registra entrenamientos para ver tus graficos de progreso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 space-y-4">
      <h2 className="text-xl font-bold text-white">Progreso</h2>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{totalSessions}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Sesiones</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{totalSets}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Series totales</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{Math.round(totalVolume).toLocaleString('es-ES')}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">kg volumen</p>
        </div>
      </div>

      {/* Weekly volume chart */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Volumen semanal (8 semanas)</h3>
        </div>
        <div className="flex items-end gap-1.5 h-32">
          {weeklyVolume.map((w, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full gradient-brand rounded-t-lg min-h-[2px] transition-all duration-300"
                  style={{ height: `${(w.volume / maxWeeklyVolume) * 100}%` }}
                  title={`${w.volume} kg · ${w.sets} series`}
                />
              </div>
              <span className="text-[8px] text-zinc-600">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top exercises by 1RM */}
      {topExercises1RM.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white">1RM estimado (Brzycki)</h3>
          </div>
          <div className="space-y-2">
            {topExercises1RM.map((ex) => (
              <div key={ex.name} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{ex.name}</p>
                  <p className="text-[10px] text-zinc-500">
                    Mejor: {ex.bestWeight} kg x {ex.bestReps} · {ex.totalSets} series
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-cyan-300">{ex.best1RM}</p>
                  <p className="text-[9px] text-zinc-600">kg</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Muscle group distribution */}
      {muscleDistribution.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Distribucion por grupo muscular</h3>
          </div>
          <div className="space-y-2">
            {muscleDistribution.map((m) => (
              <div key={m.muscle} className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 w-24 truncate shrink-0">{m.muscle}</span>
                <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="gradient-brand h-full rounded-full transition-all duration-300"
                    style={{ width: `${(m.sets / maxMuscleSets) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 w-6 text-right">{m.sets}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training frequency */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Frecuencia de entrenamiento</h3>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {(() => {
            const last30: { date: string; trained: boolean }[] = [];
            const now = new Date();
            for (let i = 29; i >= 0; i--) {
              const d = new Date(now);
              d.setDate(now.getDate() - i);
              const dateStr = d.toISOString().split('T')[0];
              const trained = sessions.some((s) => s.date === dateStr);
              last30.push({ date: dateStr, trained });
            }
            return last30.map((d, idx) => (
              <div
                key={idx}
                className={`aspect-square rounded ${d.trained ? 'gradient-brand shadow-glow' : 'bg-zinc-800'}`}
                title={d.date}
              />
            ));
          })()}
        </div>
        <p className="text-[10px] text-zinc-500 mt-2 text-center">Ultimos 30 dias</p>
      </div>
    </div>
  );
}
