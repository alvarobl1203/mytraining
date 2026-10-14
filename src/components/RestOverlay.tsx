// ===========================================================================
// MyTraining — Overlay de descanso
// ===========================================================================
// Modal con anillo, tiempo editable y ± 15s.
// Notifica al padre cada vez que el usuario cambia la duración para que
// se persista y la siguiente serie del mismo ejercicio herede ese valor.
// ===========================================================================

import { useEffect, useRef, useState } from 'react';
import { SkipForward, X, Minus, Plus } from 'lucide-react';
import {
  notifyRestComplete,
  playBeep,
  vibrate,
} from '../lib/notifications';

const REST_STEP_SEC = 15;
const REST_MIN_SEC = 5;
const REST_MAX_SEC = 900;

export function RestOverlay({
  exerciseName,
  nextSetNumber,
  initialSeconds,
  onFinish,
  onCancel,
  onChangeSeconds,
}: {
  exerciseName: string;
  nextSetNumber: number;
  initialSeconds: number;
  onFinish: () => void;
  onCancel: () => void;
  /** Notifica al padre cada cambio de duración para persistirlo. */
  onChangeSeconds?: (seconds: number) => void;
}) {
  const safeInitial = Math.max(
    REST_MIN_SEC,
    Math.min(REST_MAX_SEC, Math.round(initialSeconds))
  );

  const [durationSec, setDurationSec] = useState<number>(safeInitial);
  const [endTime, setEndTime] = useState<number>(
    () => Date.now() + safeInitial * 1000
  );
  const [remaining, setRemaining] = useState(safeInitial);
  const [inputDraft, setInputDraft] = useState<string>(String(safeInitial));
  const notifiedRef = useRef(false);

  // Sincroniza draft cuando cambia durationSec
  useEffect(() => {
    setInputDraft(String(durationSec));
  }, [durationSec]);

  // Timer
  useEffect(() => {
    const tick = () => {
      const rem = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemaining(rem);

      if (rem === 0 && !notifiedRef.current) {
        notifiedRef.current = true;
        playBeep();
        vibrate([200, 100, 200]);
        notifyRestComplete(exerciseName, nextSetNumber);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    const onVis = () => tick();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [endTime, exerciseName, nextSetNumber]);

  function applyNewDuration(newDuration: number) {
    const safe = Math.max(REST_MIN_SEC, Math.min(REST_MAX_SEC, newDuration));
    const elapsed = durationSec - remaining;
    const newRemaining = Math.max(REST_MIN_SEC, safe - elapsed);
    setDurationSec(safe);
    setEndTime(Date.now() + newRemaining * 1000);
    onChangeSeconds?.(safe);
  }

  function adjust(deltaSec: number) {
    const next = durationSec + deltaSec;
    applyNewDuration(next);
  }

  function commitInput(raw: string) {
    const v = Number(raw.replace(',', '.').trim());
    if (!Number.isFinite(v)) {
      setInputDraft(String(durationSec));
      return;
    }
    const rounded = Math.round(v);
    if (rounded < REST_MIN_SEC || rounded > REST_MAX_SEC) {
      setInputDraft(String(durationSec));
      return;
    }
    applyNewDuration(rounded);
  }

  const pct =
    durationSec > 0
      ? Math.max(0, Math.min(1, 1 - remaining / durationSec))
      : 0;

  const radius = 80;
  const circ = 2 * Math.PI * radius;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const done = remaining === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5 pb-8">
        {/* Cabecera */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">Descanso</h2>
          <button
            onClick={onCancel}
            className="text-zinc-500"
            aria-label="Cerrar descanso"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ejercicio + siguiente serie */}
        <p className="mb-4 truncate text-center text-xs text-zinc-500">
          {exerciseName} · Serie {nextSetNumber}
        </p>

        {/* Anillo */}
        <div className="mx-auto mb-4 flex h-[200px] w-[200px] items-center justify-center">
          <div className="relative h-full w-full">
            <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#18181b"
                strokeWidth="8"
              />
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="url(#restOverlayGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct)}
                style={{ transition: 'stroke-dashoffset 0.25s linear' }}
              />
              <defs>
                <linearGradient id="restOverlayGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Descanso
              </p>
              <p
                className={`mt-1 text-4xl font-extrabold tabular-nums ${
                  done ? 'text-emerald-400' : 'text-cyan-400'
                }`}
              >
                {minutes}:{String(seconds).padStart(2, '0')}
              </p>
              <p className="mt-1 text-[11px] text-zinc-300">
                {done ? '¡A por la siguiente!' : 'Toca para saltar'}
              </p>
            </div>
          </div>
        </div>

        {/* Ajuste: −15s | input editable | +15s */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <button
            onClick={() => adjust(-REST_STEP_SEC)}
            className="flex h-9 items-center gap-1 rounded-xl border border-zinc-800 px-3 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700"
            aria-label="Restar 15 segundos"
          >
            <Minus size={12} /> 15s
          </button>

          <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5">
            <p className="text-[9px] uppercase tracking-widest text-zinc-500">
              Descanso
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={inputDraft}
              onChange={(e) => setInputDraft(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={(e) => commitInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-14 bg-transparent text-center text-sm font-bold tabular-nums text-zinc-200 outline-none"
              aria-label="Segundos de descanso"
            />
            <span className="text-sm font-bold text-zinc-200">s</span>
          </div>

          <button
            onClick={() => adjust(REST_STEP_SEC)}
            className="flex h-9 items-center gap-1 rounded-xl border border-zinc-800 px-3 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700"
            aria-label="Sumar 15 segundos"
          >
            15s <Plus size={12} />
          </button>
        </div>

        {/* Saltar */}
        <button
          onClick={onFinish}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 active:scale-[0.98]"
        >
          <SkipForward size={14} /> Saltar descanso
        </button>
      </div>
    </div>
  );
}