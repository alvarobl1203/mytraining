/**
 * Utilidades de notificación y audio para el timer de descanso.
 */

let audioCtx: AudioContext | null = null;

/**
 * Pide permiso para mostrar notificaciones. Devuelve true si las tenemos.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

/**
 * Notifica que el descanso ha terminado.
 * Si no hay permiso, no hace nada.
 */
export function notifyRestComplete(
  exerciseName: string,
  nextSetNumber: number
): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification('⏱ Descanso terminado', {
      body: `${exerciseName} · Siguiente: serie ${nextSetNumber}`,
      icon: '/icon-192.png',
      tag: 'mytraining-rest',
      silent: false,
    });
  } catch {
    // ignore
  }
}

/**
 * Beep corto con Web Audio API (no necesita archivo).
 * 3 tonos ascendentes para llamar la atención.
 */
export function playBeep(): void {
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      audioCtx = new Ctor();
    }
    const ctx = audioCtx;
    if (ctx.state === 'suspended') void ctx.resume();

    const notes = [660, 880, 1100];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(
        0.25,
        ctx.currentTime + i * 0.15 + 0.01
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + i * 0.15 + 0.14
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.16);
    });
  } catch {
    // ignore — no hay audio disponible
  }
}

/**
 * Vibración (móvil). Ignora si no está soportado.
 */
export function vibrate(pattern: number | number[] = [200, 100, 200]): void {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
}