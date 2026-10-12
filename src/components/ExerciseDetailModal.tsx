import { X, Dumbbell, Tag } from 'lucide-react';
import type { Exercise } from '../types';
import { MuscleBadges } from './MuscleBadges';
import { ExerciseImage } from './ExerciseImage';
import { ExerciseStatsPanel } from './ExerciseStatsPanel';

export function ExerciseDetailModal({
  exercise,
  userId,
  onClose,
}: {
  exercise: Exercise;
  userId?: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5 pb-8">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold leading-tight">{exercise.name}</h2>
            <p className="mt-1 text-xs text-zinc-500">{exercise.category}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <ExerciseImage src={exercise.imageUrl} alt={exercise.name} size="lg" />
        </div>

        <div className="mb-4 rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Músculos implicados
          </p>
          <MuscleBadges
            primary={exercise.primaryMuscle}
            secondary={exercise.secondaryMuscles}
          />
        </div>

        <div className="mb-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Dumbbell size={14} /> {exercise.equipment}
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Tag size={14} /> {exercise.isPublic ? 'Catálogo oficial' : 'Personalizado'}
          </div>
        </div>

        {exercise.instructions && (
          <div className="mb-4 rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Instrucciones
            </p>
            <p className="text-sm leading-relaxed text-zinc-300">
              {exercise.instructions}
            </p>
          </div>
        )}

        {/* Panel de stats: solo si tenemos userId */}
        {userId && <ExerciseStatsPanel userId={userId} exercise={exercise} />}
      </div>
    </div>
  );
}