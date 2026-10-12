import { useEffect, useState } from 'react';
import { X, SkipForward } from 'lucide-react';
import { REST_OPTIONS_MIN } from '../lib/constants';

export function RestTimer({
  onFinish,
  onCancel,
}: {
  onFinish: () => void;
  onCancel: () => void;
}) {
  const [minutes, setMinutes] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (!running && minutes !== null && remaining === 0) {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  }, [running, remaining, minutes]);

  function select(m: number) {
    setMinutes(m);
    setRemaining(Math.round(m * 60));
    setRunning(true);
  }

  const total = minutes ? minutes * 60 : 0;
  const pct = total > 0 ? (total - remaining) / total : 0;
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  const radius = 70;
  const circ = 2 * Math.PI * radius;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div
        className={`w-full rounded-t-3xl border-t bg-zinc-950 p-5 pb-8 transition-all ${
          running && remaining === 0
            ? 'border-cyan-400 animate-pulse-blue'
            : 'border-zinc-800'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Descanso</h2>
          <button onClick={onCancel}>
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        {minutes === null ? (
          <div>
            <p className="mb-3 text-xs text-zinc-400">
              Selecciona los minutos de descanso
            </p>
            <div className="grid grid-cols-5 gap-2">
              {REST_OPTIONS_MIN.map((m) => (
                <button
                  key={m}
                  onClick={() => select(m)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 py-3 text-sm font-semibold text-zinc-200 hover:border-blue-500 hover:text-blue-400"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative h-[170px] w-[170px]">
              <svg viewBox="0 0 170 170" className="absolute inset-0 -rotate-90">
                <circle cx="85" cy="85" r={radius} fill="none" stroke="#27272a" strokeWidth="10" />
                <circle
                  cx="85"
                  cy="85"
                  r={radius}
                  fill="none"
                  stroke="url(#restGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - pct)}
                />
                <defs>
                  <linearGradient id="restGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p
                  className={`text-3xl font-bold tabular-nums ${
                    remaining === 0 ? 'text-cyan-400' : 'text-zinc-100'
                  }`}
                >
                  {mm}:{String(ss).padStart(2, '0')}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {running ? 'En descanso' : 'Finalizado'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex w-full gap-2">
              <button
                onClick={() => {
                  setMinutes(null);
                  setRemaining(0);
                  setRunning(false);
                }}
                className="flex-1 rounded-2xl border border-zinc-800 py-3 text-sm text-zinc-300"
              >
                Cambiar
              </button>
              <button
                onClick={onFinish}
                className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
              >
                <SkipForward size={14} className="mr-1.5 inline" /> Saltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}