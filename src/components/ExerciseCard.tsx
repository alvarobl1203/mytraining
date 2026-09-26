import type { Exercise } from '@/types/exercise';
import { Dumbbell } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  onClick?: () => void;
}

export default function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4 hover:border-blue-500/30 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-white leading-tight">{exercise.name}</h3>
        <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400">
          {exercise.category}
        </span>
      </div>

      {/* Primary muscle — blue/cyan badge */}
      <div className="mb-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-cyan-300">
          {exercise.primary_muscle}
        </span>
      </div>

      {/* Secondary muscles — gray badges */}
      {exercise.secondary_muscles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {exercise.secondary_muscles.map((muscle) => (
            <span
              key={muscle}
              className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300"
            >
              {muscle}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
        <Dumbbell size={11} />
        {exercise.equipment}
      </div>
    </button>
  );
}
