import { useEffect, useMemo, useState } from 'react';
import { Plus, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useExercises } from '../hooks/useExercises';
import { useProfile } from '../hooks/useProfile';
import { useWeeklyVolume } from '../hooks/useWeeklyVolume';
import { useMuscleRecovery } from '../hooks/useMuscleRecovery';
import { useBodyweight } from '../hooks/useBodyweight';
import { useDeload } from '../hooks/useDeload';
import { useMuscleFrequency } from '../hooks/useMuscleFrequency';
import { BodyHeatmap } from '../components/BodyHeatmap';
import { VolumeHexagon } from '../components/VolumeHexagon';
import { VolumeRangesList } from '../components/VolumeRangesList';
import { VolumePanel } from '../components/VolumePanel';
import { PlateauCard } from '../components/PlateauCard';
import { DeloadCard } from '../components/DeloadCard';
import { FitnessChart } from '../components/FitnessChart';
import { ExportSheet } from '../components/ExportSheet';
import {
  OneRmChart,
  TonnageChart,
  BodyweightChart,
} from '../components/ProgressCharts';
import {
  MuscleRadar,
  WeeklyVolumeTrend,
  RirProgression,
  MuscleFrequency as MuscleFrequencyChart,
  MuscleVolumeBars,
} from '../components/AnalyticsCharts';
import { detectPlateaus } from '../lib/plateau';
import type { Workout, WorkoutSet } from '../types';

type Props = { userId: string };

const BIG_LIFT_NAME = 'Press banca con barra';

export function ProgressScreen({ userId }: Props) {
  const { exercises } = useExercises();
  const { profile } = useProfile(userId);
  const { setsPerMuscle } = useWeeklyVolume(userId);
  const { data: recovery } = useMuscleRecovery(userId);
  const { logs: bwLogs, add: addBw } = useBodyweight(userId);
  const { frequency } = useMuscleFrequency(userId, 30);

  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);
  const [allSets, setAllSets] = useState<WorkoutSet[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [bwInput, setBwInput] = useState('');
  const [showBwInput, setShowBwInput] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: ws } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .not('finished_at', 'is', null)
        .order('finished_at');

      const workoutIds = (ws ?? []).map(
        (w: Record<string, unknown>) => w.id as string
      );
      const { data: sets } = workoutIds.length
        ? await supabase
            .from('workout_sets')
            .select('*')
            .in('workout_id', workoutIds)
        : { data: [] as unknown[] };

      const wf: Workout[] = (ws ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        userId: r.user_id as string,
        routineId: (r.routine_id as string | null) ?? null,
        startedAt: r.started_at as string,
        finishedAt: (r.finished_at as string | null) ?? null,
        notes: (r.notes as string | null) ?? null,
      }));

      const sf: WorkoutSet[] = (sets ?? []).map(
        (r: Record<string, unknown>) => ({
          id: r.id as string,
          workoutId: r.workout_id as string,
          exerciseId: r.exercise_id as string,
          setNumber: r.set_number as number,
          weightKg: r.weight_kg !== null ? Number(r.weight_kg) : null,
          reps: r.reps !== null ? Number(r.reps) : null,
          rir: r.rir !== null ? Number(r.rir) : null,
          technique: (r.technique as WorkoutSet['technique']) ?? 'Normal',
          cardioSeconds:
            r.cardio_seconds !== null ? Number(r.cardio_seconds) : null,
          cardioKm: r.cardio_km !== null ? Number(r.cardio_km) : null,
          cardioKcal: r.cardio_kcal !== null ? Number(r.cardio_kcal) : null,
          notes: (r.notes as string | null) ?? null,
          estimated1Rm:
            r.estimated_1rm !== null && r.estimated_1rm !== undefined
              ? Number(r.estimated_1rm)
              : null,
          isPr: Boolean(r.is_pr),
          completed: Boolean(r.completed),
        })
      );

      setAllWorkouts(wf);
      setAllSets(sf);
      setLoadingData(false);
    })();
  }, [userId]);

  const bigLift = exercises.find((e) => e.name === BIG_LIFT_NAME);

  const plateaus = useMemo(
    () => detectPlateaus(exercises, allWorkouts, allSets),
    [exercises, allWorkouts, allSets]
  );

  const { deload } = useDeload(userId, plateaus.length);

  const totalSessions = allWorkouts.length;
  const totalSets = allSets.filter((s) => s.completed).length;
  const totalTonnage = allSets.reduce((a, s) => {
    if (!s.completed || !s.weightKg || !s.reps) return a;
    return a + s.weightKg * s.reps;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-[22px] font-extrabold tracking-tight">Progreso</h1>
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 active:scale-[0.97]"
        >
          <Share2 size={12} /> Exportar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Sesiones" value={totalSessions} />
        <Stat label="Series totales" value={totalSets} />
        <Stat label="kg volumen" value={Math.round(totalTonnage)} />
      </div>

      {deload && <DeloadCard deload={deload} />}

      <BodyHeatmap data={recovery} />

      {!loadingData && <FitnessChart workouts={allWorkouts} sets={allSets} />}

      <MuscleRadar setsPerMuscle={setsPerMuscle} />

      {profile?.showVolumePanel && <VolumePanel setsPerMuscle={setsPerMuscle} />}

      <VolumeHexagon setsPerMuscle={setsPerMuscle} />

      <VolumeRangesList setsPerMuscle={setsPerMuscle} />

      <MuscleVolumeBars setsPerMuscle={setsPerMuscle} />
      <MuscleFrequencyChart frequencyByMuscle={frequency} />

      <PlateauCard alerts={plateaus} />

      {!loadingData && (
        <>
          <WeeklyVolumeTrend
            workouts={allWorkouts.map((w) => ({
              id: w.id,
              finishedAt: w.finishedAt,
            }))}
            sets={allSets.map((s) => ({
              workoutId: s.workoutId,
              completed: s.completed,
              weightKg: s.weightKg,
              reps: s.reps,
            }))}
          />
          <RirProgression
            workouts={allWorkouts.map((w) => ({
              id: w.id,
              finishedAt: w.finishedAt,
            }))}
            sets={allSets.map((s) => ({
              workoutId: s.workoutId,
              completed: s.completed,
              rir: s.rir,
            }))}
          />
          {bigLift && (
            <OneRmChart
              exercise={bigLift}
              workouts={allWorkouts}
              sets={allSets}
            />
          )}
          <TonnageChart workouts={allWorkouts} sets={allSets} />
        </>
      )}

      <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Peso corporal
          </p>
          <button
            onClick={() => setShowBwInput((s) => !s)}
            className="flex items-center gap-1 rounded-xl border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
          >
            <Plus size={11} /> Registrar
          </button>
        </div>
        {showBwInput && (
          <div className="mb-3 flex animate-fade-in gap-2">
            <input
              value={bwInput}
              onChange={(e) => setBwInput(e.target.value)}
              type="number"
              step="0.1"
              placeholder="Peso (kg)"
              className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500"
            />
            <button
              onClick={async () => {
                const v = Number(bwInput);
                if (v > 0) {
                  await addBw(v);
                  setBwInput('');
                  setShowBwInput(false);
                }
              }}
              className="rounded-2xl bg-grad-brand px-5 text-sm font-semibold text-white shadow-cta transition-all duration-200 hover:shadow-cta-hover active:scale-[0.97]"
            >
              OK
            </button>
          </div>
        )}
        <BodyweightChart logs={bwLogs} />
      </div>

      {showExport && (
        <ExportSheet
          workouts={allWorkouts}
          sets={allSets}
          exercises={exercises}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-3 text-center shadow-card">
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-zinc-500">{label}</p>
    </div>
  );
}