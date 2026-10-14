// ===========================================================================
// MyTraining — Persistencia del descanso en sessionStorage
// ===========================================================================
// Permite recuperar el timer del descanso si el usuario recarga la pestaña
// o cierra/reabre el modo inmersivo durante un entreno.
// ===========================================================================

const IMMERSIVE_KEY = 'mytraining:rest-immersive';

export interface ImmersiveRestState {
  endTime: number;
  durationSec: number;
}

function safeParse(raw: string | null): ImmersiveRestState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ImmersiveRestState>;
    if (
      typeof parsed?.endTime === 'number' &&
      typeof parsed?.durationSec === 'number'
    ) {
      return { endTime: parsed.endTime, durationSec: parsed.durationSec };
    }
    return null;
  } catch {
    return null;
  }
}

/** Guarda el estado del descanso del inmersivo. Pasa `null` para limpiarlo. */
export function saveImmersiveRest(state: ImmersiveRestState | null): void {
  try {
    if (state === null) {
      sessionStorage.removeItem(IMMERSIVE_KEY);
    } else {
      sessionStorage.setItem(IMMERSIVE_KEY, JSON.stringify(state));
    }
  } catch {
    // sessionStorage puede fallar en modo privado; lo ignoramos.
  }
}

/**
 * Carga el estado del descanso del inmersivo si sigue activo.
 * Devuelve `null` si no hay nada guardado o si ya ha caducado.
 * Auto-limpia la entrada si estaba caducada.
 */
export function loadImmersiveRest(): ImmersiveRestState | null {
  const parsed = safeParse(sessionStorage.getItem(IMMERSIVE_KEY));
  if (!parsed) {
    saveImmersiveRest(null);
    return null;
  }
  if (parsed.endTime <= Date.now()) {
    saveImmersiveRest(null);
    return null;
  }
  return parsed;
}

/** Limpia todas las claves de descanso persistidas. */
export function clearAllRest(): void {
  saveImmersiveRest(null);
}