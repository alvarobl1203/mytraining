import { Zap } from 'lucide-react';
import type { Exercise, MuscleInvolvement } from '../types';
import { MiniMuscleMap } from './MiniMuscleMap';
import { HighlightedText } from './HighlightedText';

const DIFFICULTY_COLOR: Record<string, string> = {
  Principiante: 'text-emerald-400 border-emerald-500/30',
  Intermedio: 'text-yellow-400 border-yellow-500/30',
  Avanzado: 'text-red-400 border-red-500/30',
};

export function ExerciseCard({
  exercise,
  onClick,
  query = '',
}: {
  exercise: Exercise;
  onClick: () => void;
  query?: string;
}) {
  const involvement: MuscleInvolvement = exercise.muscleInvolvement ?? {};
  const topMuscles = Object.entries(involvement)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    .slice(0, 3)
    .map(([m]) => m);

  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-3 text-left transition-colors hover:border-zinc-700"
    >
      <MiniMuscleMap involvement={involvement} size={48} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-100">
            <HighlightedText text={exercise.name} query={query} />
          </p>
          {exercise.difficulty && (
            <span
              className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] uppercase ${DIFFICULTY_COLOR[exercise.difficulty] ?? ''}`}
            >
              {exercise.difficulty}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {exercise.exerciseType && (
            <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[9px] uppercase text-zinc-400">
              {exercise.exerciseType}
            </span>
          )}
          {exercise.movementPattern && (
            <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[9px] uppercase text-zinc-400">
              {exercise.movementPattern}
            </span>
          )}
          {exercise.isCompound && (
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/5 px-1.5 py-0.5 text-[9px] text-cyan-400">
              Compuesto
            </span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {topMuscles.map((m) => (
            <span key={m} className="text-[10px] text-zinc-500">
              {m} (
              {Math.round(
                (involvement[m as keyof MuscleInvolvement] ?? 0) * 100
              )}
              %)
            </span>
          ))}
        </div>
      </div>
      <Zap size={14} className="mt-0.5 shrink-0 text-zinc-600" />
    </button>
  );
}