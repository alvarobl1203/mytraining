import { useEffect } from 'react';

/**
 * Mantiene la pantalla encendida mientras el componente está montado.
 * Se usa durante el entrenamiento para evitar que el móvil se bloquee
 * y mate el timer de descanso.
 *
 * Requiere HTTPS o localhost. Si no está soportado, no hace nada.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === 'undefined') return;
    if (!('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    async function acquire() {
      try {
        const nav = navigator as Navigator & {
          wakeLock: {
            request: (type: 'screen') => Promise<WakeLockSentinel>;
          };
        };
        sentinel = await nav.wakeLock.request('screen');
        if (cancelled && sentinel) {
          try {
            await sentinel.release();
          } catch {
            // ignore
          }
        }
      } catch {
        // Permiso denegado o no soportado — continuamos sin wake lock
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible' && !sentinel) {
        void acquire();
      }
    }

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (sentinel) {
        sentinel.release().catch(() => {});
        sentinel = null;
      }
    };
  }, [active]);
}