import { useState } from 'react';
import { X, FileText, FileType, Loader2, Check, Copy } from 'lucide-react';
import { buildDataset, type ExportScope, type ExportContent } from '../lib/exporters';
import { copyToClipboard, downloadText } from '../lib/fileActions';
import { buildAnalyticsPDF } from '../lib/pdfBuilder';
import { useToast } from '../lib/ui/ToastProvider';
import type { Workout, WorkoutSet, Exercise } from '../types';

type Props = {
  workouts: Workout[];
  sets: WorkoutSet[];
  exercises: Exercise[];
  onClose: () => void;
};

const SCOPE_OPTIONS: { id: ExportScope['kind']; label: string }[] = [
  { id: 'week', label: 'Última semana' },
  { id: 'month', label: 'Mes actual' },
  { id: 'range', label: 'Últimos 90 días' },
  { id: 'year', label: 'Año actual' },
  { id: 'all', label: 'Historial completo' },
];

const SCOPE_LABEL: Record<ExportScope['kind'], string> = {
  week: 'Última semana',
  month: 'Mes actual',
  range: 'Últimos 90 días',
  year: 'Año actual',
  all: 'Historial completo',
  analytics: 'Análisis completo',
};

export function ExportSheet({ workouts, sets, exercises, onClose }: Props) {
  const [scope, setScope] = useState<ExportScope['kind']>('week');
  const [exerciseId, setExerciseId] = useState<string>('');
  const [content, setContent] = useState<ExportContent>({
    volume: true,
    prs: true,
    rir: false,
    bodyweight: false,
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const toast = useToast();

  const exerciseOptions = exercises
    .filter((e) => sets.some((s) => s.exerciseId === e.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  function currentScope(): ExportScope {
    return { kind: scope, exerciseId: exerciseId || undefined };
  }

  const filename = `mytraining-analiticas-${scope}-${Date.now()}`;

  function buildText(): string {
    const data = buildDataset(workouts, sets, exercises, currentScope(), content);
    const lines: string[] = [];
    lines.push('📊 MyTraining — Análisis');
    lines.push(`📅 ${new Date().toLocaleDateString('es-ES')}`);
    lines.push(`🎯 Alcance: ${SCOPE_LABEL[scope]}`);
    lines.push('');
    lines.push('═══ RESUMEN ═══');
    lines.push(`Entrenamientos: ${data.summary.totalWorkouts}`);
    lines.push(`Series totales: ${data.summary.totalSets}`);
    lines.push(`Volumen total: ${data.summary.totalVolume.toLocaleString('es-ES')} kg`);
    lines.push(`PRs conseguidos: ${data.summary.totalPRs}`);
    lines.push('');

    if (content.volume && data.exercises.length > 0) {
      lines.push('═══ EJERCICIOS ═══');
      data.exercises.forEach((e) => {
        lines.push(
          `• ${e.name}: ${e.sets} series · ${e.volume.toFixed(0)} kg · Mejor 1RM ${e.best.toFixed(1)} kg`
        );
      });
      lines.push('');
    }

    if (content.prs && data.prs.length > 0) {
      lines.push('═══ PRs ═══');
      data.prs.forEach((p) => {
        lines.push(
          `🏆 ${p.exercise}: ${p.weightKg} kg × ${p.reps} (1RM ${
            p.estimated1Rm?.toFixed(1) ?? '—'
          })`
        );
      });
      lines.push('');
    }

    lines.push('#MyTraining');
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
      console.error(`[ExportSheet] ${key} failed:`, e);
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
            <h2 className="text-lg font-bold">Exportar análisis</h2>
            <p className="text-[11px] text-zinc-500">
              Copia, descarga en .txt o guarda como .pdf
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500">
            <X size={18} />
          </button>
        </div>

        <Section title="Alcance">
          <div className="flex flex-wrap gap-1.5">
            {SCOPE_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setScope(s.id)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  scope === s.id
                    ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Ejercicio (opcional)">
          <select
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Todos los ejercicios</option>
            {exerciseOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Section>

        <Section title="Contenido">
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              label="Volumen"
              checked={content.volume}
              onChange={(v) => setContent({ ...content, volume: v })}
            />
            <Checkbox
              label="PRs"
              checked={content.prs}
              onChange={(v) => setContent({ ...content, prs: v })}
            />
            <Checkbox
              label="RIR medio"
              checked={content.rir}
              onChange={(v) => setContent({ ...content, rir: v })}
            />
            <Checkbox
              label="Peso corporal"
              checked={content.bodyweight}
              onChange={(v) => setContent({ ...content, bodyweight: v })}
            />
          </div>
        </Section>

        <Section title="Acciones">
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
                  'Texto copiado al portapapeles'
                )
              }
            />
            <ActionButton
              icon={FileText}
              label="Descargar .txt"
              description="Archivo de texto plano con todo el contenido"
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
              description="Reporte formateado con tablas y gráficos vectoriales"
              busy={busy === 'pdf'}
              done={done === 'pdf'}
              onClick={() =>
                withBusy(
                  'pdf',
                  () => {
                    const data = buildDataset(
                      workouts,
                      sets,
                      exercises,
                      currentScope(),
                      content
                    );

                    const pdf = buildAnalyticsPDF({
                      scopeLabel: `${SCOPE_LABEL[scope]} · ${
                        exerciseId
                          ? exercises.find((e) => e.id === exerciseId)?.name ?? 'Todos'
                          : 'Todos los ejercicios'
                      }`,
                      totalWorkouts: data.summary.totalWorkouts,
                      totalSets: data.summary.totalSets,
                      totalVolume: data.summary.totalVolume,
                      totalPRs: data.summary.totalPRs,
                      exercises: data.exercises.map((e) => ({
                        name: e.name,
                        sets: e.sets,
                        volume: e.volume,
                        best: e.best,
                      })),
                      prs: data.prs.map((p) => ({
                        exercise: p.exercise,
                        weight: p.weightKg ?? 0,
                        reps: p.reps ?? 0,
                        estimated1Rm: p.estimated1Rm,
                      })),
                      includeVolume: content.volume,
                      includePrs: content.prs,
                    });

                    pdf.save(`${filename}.pdf`);
                  },
                  'PDF descargado'
                )
              }
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        {title}
      </p>
      {children}
    </section>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-cyan-500"
      />
      <span className="text-xs text-zinc-300">{label}</span>
    </label>
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