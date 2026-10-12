import { useState } from 'react';
import { X, FileText, FileType, Loader2, Check, Copy } from 'lucide-react';
import { DAY_LABELS } from '../lib/constants';
import { copyToClipboard, downloadText } from '../lib/fileActions';
import { buildPlanPDF } from '../lib/pdfBuilder';
import { useToast } from '../lib/ui/ToastProvider';
import type { RoutineWithExercises } from '../hooks/useRoutines';

type Props = {
  routines: RoutineWithExercises[];
  planName: string;
  onClose: () => void;
};

export function PlanExportSheet({ routines, planName, onClose }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const toast = useToast();

  const slug = planName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const filename = `${slug || 'plan'}-${Date.now()}`;

  const orderedRoutines = [...routines].sort((a, b) => {
    const A = a.dayOfWeek ?? 99;
    const B = b.dayOfWeek ?? 99;
    return A - B;
  });

  const totalExercises = orderedRoutines.reduce((a, r) => a + r.exercises.length, 0);
  const restCount = orderedRoutines.filter((r) => r.isRest).length;

  function buildText(): string {
    const lines: string[] = [];
    lines.push(`📋 PLAN: ${planName}`);
    lines.push(
      `📅 ${orderedRoutines.length} ${orderedRoutines.length === 1 ? 'día' : 'días'} · ${totalExercises} ejercicios${
        restCount > 0 ? ` · ${restCount} descanso${restCount > 1 ? 's' : ''}` : ''
      }`
    );
    lines.push('');
    lines.push('═══════════════════════════════');

    orderedRoutines.forEach((r) => {
      const dayName = r.dayOfWeek !== null ? DAY_LABELS[r.dayOfWeek] : 'Sin día';
      const label = r.isRest
        ? r.dayLabel && r.dayLabel !== planName
          ? r.dayLabel
          : 'Descanso'
        : r.dayLabel && r.dayLabel !== planName
          ? r.dayLabel
          : 'Sesión';

      lines.push('');
      lines.push(`${dayName.toUpperCase()} — ${label}`);
      lines.push('───────────────────────────────');

      if (r.isRest) {
        lines.push('  🛌 Descanso');
      } else if (r.exercises.length === 0) {
        lines.push('  Sin ejercicios asignados');
      } else {
        r.exercises.forEach((re, idx) => {
          const exName = re.exercise?.name ?? '—';
          lines.push(`${idx + 1}. ${exName}`);
          lines.push(
            `   ${re.targetSets}×${re.targetRepsMin}-${re.targetRepsMax} · RIR ${re.targetRir} · Descanso ${re.restSeconds}s`
          );
          if (re.exercise?.primaryMuscle) {
            lines.push(`   Primario: ${re.exercise.primaryMuscle}`);
          }
          if (re.exercise?.secondaryMuscles?.length) {
            lines.push(`   Secundarios: ${re.exercise.secondaryMuscles.join(', ')}`);
          }
        });
      }
    });

    lines.push('');
    lines.push('═══════════════════════════════');
    lines.push('Generado por MyTraining ⚡');
    return lines.join('\n');
  }

  async function withBusy(
    key: string,
    fn: () => Promise<void> | void,
    successMsg: string
  ) {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
      setDone(key);
      toast.success(successMsg);
      setTimeout(() => setDone(null), 2000);
    } catch (e) {
      console.error(`[PlanExportSheet] ${key} failed:`, e);
      toast.error('Error al exportar', 'Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Exportar plan</h2>
            <p className="text-[11px] text-zinc-500">
              {planName} · {orderedRoutines.length}{' '}
              {orderedRoutines.length === 1 ? 'día' : 'días'}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <ActionButton
            icon={Copy}
            label="Copiar texto"
            description="Al portapapeles, listo para WhatsApp o notas"
            busy={busy === 'copy'}
            done={done === 'copy'}
            onClick={() =>
              withBusy(
                'copy',
                () => copyToClipboard(buildText()),
                'Plan copiado al portapapeles'
              )
            }
          />
          <ActionButton
            icon={FileText}
            label="Descargar .txt"
            description="Archivo de texto plano con el plan completo"
            busy={busy === 'txt'}
            done={done === 'txt'}
            onClick={() =>
              withBusy(
                'txt',
                () => downloadText(buildText(), `${filename}.txt`),
                'Archivo .txt descargado'
              )
            }
          />
          <ActionButton
            icon={FileType}
            label="Descargar .pdf"
            description="Reporte formateado por día con ejercicios y series"
            busy={busy === 'pdf'}
            done={done === 'pdf'}
            onClick={() =>
              withBusy(
                'pdf',
                () => {
                  const pdf = buildPlanPDF({
                    planName,
                    totalDays: orderedRoutines.length,
                    totalExercises,
                    restCount,
                    days: orderedRoutines.map((r) => ({
                      dayName:
                        r.dayOfWeek !== null ? DAY_LABELS[r.dayOfWeek] : 'Sin día',
                      label: r.isRest
                        ? r.dayLabel && r.dayLabel !== planName
                          ? r.dayLabel
                          : 'Descanso'
                        : r.dayLabel && r.dayLabel !== planName
                          ? r.dayLabel
                          : 'Sesión',
                      isRest: r.isRest,
                      exercises: r.exercises.map((re) => ({
                        name: re.exercise?.name ?? '—',
                        sets: re.targetSets,
                        repsMin: re.targetRepsMin,
                        repsMax: re.targetRepsMax,
                        rir: re.targetRir,
                        restSeconds: re.restSeconds,
                        primaryMuscle: re.exercise?.primaryMuscle,
                        secondaryMuscles: re.exercise?.secondaryMuscles,
                      })),
                    })),
                  });
                  pdf.save(`${filename}.pdf`);
                },
                'PDF descargado'
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  busy,
  done,
}: {
  icon: typeof FileText;
  label: string;
  description?: string;
  onClick: () => void;
  busy: boolean;
  done: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98] disabled:opacity-60 ${
        done
          ? 'border-cyan-500/60 bg-cyan-500/15'
          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950">
        {busy ? (
          <Loader2 size={16} className="animate-spin text-cyan-400" />
        ) : done ? (
          <Check size={16} className="text-cyan-400" />
        ) : (
          <Icon size={16} className="text-cyan-400" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${done ? 'text-cyan-200' : 'text-zinc-100'}`}>
          {done ? '¡Listo!' : label}
        </p>
        {description && !done && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}