import { useCallback, useMemo } from 'react';
import { useProfile } from './useProfile';
import type { ExerciseType, TrainingMode } from '../types';

export interface UserPreferences {
  trainingMode: TrainingMode;
  preferredTypes: ExerciseType[];
  enabledTechniques: string[];
  showTechniqueHints: boolean;
  showVolumePanel: boolean;
  /** Descanso por defecto global en segundos. */
  restDefaultSec: number;
}

const DEFAULT_PREFS: UserPreferences = {
  trainingMode: 'simple',
  preferredTypes: ['gym', 'calistenia', 'cardio'],
  enabledTechniques: [],
  showTechniqueHints: false,
  showVolumePanel: true,
  /** 2 minutos y medio. */
  restDefaultSec: 150,
};

export function useUserPreferences(userId: string | null) {
  const { profile, loading, save, reload } = useProfile(userId);

  const preferences = useMemo<UserPreferences>(() => {
    if (!profile) return DEFAULT_PREFS;
    return {
      trainingMode: profile.trainingMode,
      preferredTypes: profile.preferredTypes,
      enabledTechniques: profile.enabledTechniques,
      showTechniqueHints: profile.showTechniqueHints,
      showVolumePanel: profile.showVolumePanel,
      restDefaultSec: profile.restDefaultSec,
    };
  }, [profile]);

  const update = useCallback(
    async (patch: Partial<UserPreferences>) => {
      await save({
        ...(patch.trainingMode !== undefined && {
          trainingMode: patch.trainingMode,
        }),
        ...(patch.preferredTypes !== undefined && {
          preferredTypes: patch.preferredTypes,
        }),
        ...(patch.enabledTechniques !== undefined && {
          enabledTechniques: patch.enabledTechniques,
        }),
        ...(patch.showTechniqueHints !== undefined && {
          showTechniqueHints: patch.showTechniqueHints,
        }),
        ...(patch.showVolumePanel !== undefined && {
          showVolumePanel: patch.showVolumePanel,
        }),
        ...(patch.restDefaultSec !== undefined && {
          restDefaultSec: patch.restDefaultSec,
        }),
      });
    },
    [save]
  );

  return { preferences, loading, update, reload };
}