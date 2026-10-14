import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { sanitizePreferredTypes } from '../lib/disciplines';
import type { Profile } from '../types';

/** Fallback en segundos si la BD no tiene un valor (2 min 30 s). */
const DEFAULT_REST_SEC = 150;

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    email: (row.email as string | null) ?? null,
    age: (row.age as number | null) ?? null,
    gender: (row.gender as Profile['gender']) ?? null,
    weightKg: row.weight_kg !== null ? Number(row.weight_kg) : null,
    heightCm: (row.height_cm as number | null) ?? null,
    activityLevel: (row.activity_level as Profile['activityLevel']) ?? null,
    availableEquipment:
      (row.available_equipment as Profile['availableEquipment']) ?? [],
    onboardingCompleted: Boolean(row.onboarding_completed),
    // Sanea cualquier valor no reconocido y aplica fallback si queda vacío.
    preferredTypes: sanitizePreferredTypes(row.preferred_types),
    trainingMode:
      (row.training_mode as Profile['trainingMode']) ?? 'simple',
    enabledTechniques:
      (row.enabled_techniques as Profile['enabledTechniques']) ?? [],
    showTechniqueHints: Boolean(row.show_technique_hints),
    showVolumePanel: row.show_volume_panel !== false,
    restDefaultSec:
      row.rest_default_sec !== null && row.rest_default_sec !== undefined
        ? Number(row.rest_default_sec)
        : DEFAULT_REST_SEC,
  };
}

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data) setProfile(rowToProfile(data));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (patch: Partial<Profile>) => {
      if (!userId) throw new Error('Sin sesión');
      const dbPatch: Record<string, unknown> = {};
      if (patch.age !== undefined) dbPatch.age = patch.age;
      if (patch.gender !== undefined) dbPatch.gender = patch.gender;
      if (patch.weightKg !== undefined) dbPatch.weight_kg = patch.weightKg;
      if (patch.heightCm !== undefined) dbPatch.height_cm = patch.heightCm;
      if (patch.activityLevel !== undefined)
        dbPatch.activity_level = patch.activityLevel;
      if (patch.availableEquipment !== undefined)
        dbPatch.available_equipment = patch.availableEquipment;
      if (patch.onboardingCompleted !== undefined)
        dbPatch.onboarding_completed = patch.onboardingCompleted;
      if (patch.preferredTypes !== undefined)
        dbPatch.preferred_types = patch.preferredTypes;
      if (patch.trainingMode !== undefined)
        dbPatch.training_mode = patch.trainingMode;
      if (patch.enabledTechniques !== undefined)
        dbPatch.enabled_techniques = patch.enabledTechniques;
      if (patch.showTechniqueHints !== undefined)
        dbPatch.show_technique_hints = patch.showTechniqueHints;
      if (patch.showVolumePanel !== undefined)
        dbPatch.show_volume_panel = patch.showVolumePanel;
      if (patch.restDefaultSec !== undefined)
        dbPatch.rest_default_sec = patch.restDefaultSec;

      const { error } = await supabase
        .from('profiles')
        .update(dbPatch)
        .eq('id', userId);
      if (error) throw error;
      await reload();
    },
    [userId, reload]
  );

  return { profile, loading, save, reload };
}