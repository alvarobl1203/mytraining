import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LogOut,
  Settings,
  Flame,
  Trophy,
  TrendingUp,
  Download,
  Upload,
  Trash2,
  Info,
  MessageCircle,
  AlertTriangle,
  ChevronRight,
  User as UserIcon,
  Activity,
  Dumbbell,
  Plus,
  Loader2,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { tdee } from '../lib/calculations';
import { useStreak } from '../hooks/useStreak';
import {
  exportBackup,
  deleteAllMyData,
  previewBackup,
  importBackup,
  type ImportPreview,
} from '../lib/backup';
import { useToast } from '../lib/ui/ToastProvider';
import type { Profile } from '../types';

const APP_VERSION = '3.0.0';
const CONTACT_EMAIL = 'soporte@mytraining.app';

export function ProfileScreen({
  profile,
  onOpenPreferences,
  onSaveProfile,
}: {
  profile: Profile;
  onOpenPreferences: () => void;
  onSaveProfile: (patch: Partial<Profile>) => Promise<void>;
}) {
  const toast = useToast();
  const { current: streakCurrent, best: streakBest, totalDays } = useStreak(
    profile.id
  );

  const [stats, setStats] = useState<{
    sessions: number;
    volume: number;
    prs: number;
    loading: boolean;
  }>({ sessions: 0, volume: 0, prs: 0, loading: true });

  const [bwInput, setBwInput] = useState('');
  const [savingBw, setSavingBw] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ----- Importación de backup -----
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<{
    file: File;
    preview: ImportPreview;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);

  // Cargar estadísticas
  useEffect(() => {
    (async () => {
      const { data: workouts } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', profile.id)
        .not('finished_at', 'is', null);

      const ids = (workouts ?? []).map((w: { id: string }) => w.id);
      if (ids.length === 0) {
        setStats({ sessions: 0, volume: 0, prs: 0, loading: false });
        return;
      }

      const { data: sets } = await supabase
        .from('workout_sets')
        .select('weight_kg, reps, is_pr, completed')
        .in('workout_id', ids)
        .eq('completed', true);

      let volume = 0;
      let prs = 0;
      (sets ?? []).forEach((s: Record<string, unknown>) => {
        const w = Number(s.weight_kg ?? 0);
        const r = Number(s.reps ?? 0);
        volume += w * r;
        if (s.is_pr === true) prs++;
      });

      setStats({
        sessions: ids.length,
        volume: Math.round(volume),
        prs,
        loading: false,
      });
    })();
  }, [profile.id]);

  const kcal = useMemo(() => {
    if (
      !profile.weightKg ||
      !profile.heightCm ||
      !profile.age ||
      !profile.gender ||
      !profile.activityLevel
    ) {
      return null;
    }
    return tdee(
      profile.weightKg,
      profile.heightCm,
      profile.age,
      profile.gender,
      profile.activityLevel
    );
  }, [profile]);

  const profileIncomplete = useMemo(
    () =>
      !profile.age ||
      !profile.gender ||
      !profile.weightKg ||
      !profile.heightCm ||
      !profile.activityLevel ||
      profile.availableEquipment.length === 0,
    [profile]
  );

  const memberSince = useMemo(() => {
    return 'Miembro de MyTraining';
  }, []);

  async function saveBodyweight() {
    const v = Number(bwInput);
    if (!v || v < 20 || v > 500) return;
    setSavingBw(true);
    try {
      const { error } = await supabase.from('bodyweight_logs').insert({
        user_id: profile.id,
        weight_kg: v,
      });
      if (error) throw error;
      await onSaveProfile({ weightKg: v });
      setBwInput('');
      toast.success('Peso registrado', `${v} kg guardados correctamente.`);
    } catch (e) {
      console.error(e);
      toast.error('No se pudo registrar el peso', 'Inténtalo de nuevo.');
    } finally {
      setSavingBw(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportBackup(profile.id);
      toast.success(
        'Backup exportado',
        'Guárdalo o compártelo desde el menú del sistema.'
      );
    } catch (e) {
      console.error(e);
      toast.error('Error al exportar el backup', 'Inténtalo de nuevo.');
    } finally {
      setExporting(false);
    }
  }

  // ---------------- Importación de backup ----------------
  function handleImportClick() {
    setImportError(null);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset del input para permitir volver a seleccionar el mismo archivo
    e.target.value = '';
    if (!file) return;

    try {
      const preview = await previewBackup(file);
      setImportPreview({ file, preview });
      setImportError(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Archivo no válido.';
      toast.error('No se pudo leer el backup', msg);
    }
  }

  async function handleConfirmImport() {
    if (!importPreview) return;
    setImporting(true);
    setImportError(null);
    setImportProgress('Preparando importación…');
    try {
      const result = await importBackup(
        importPreview.file,
        profile.id,
        (msg) => setImportProgress(msg)
      );
      toast.success(
        'Backup importado',
        `${result.routines} rutinas · ${result.workouts} entrenos · ${result.workoutSets} series`
      );
      // Recarga total: los hooks vuelven a leer de Supabase
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error desconocido.';
      setImportError(msg);
      setImporting(false);
    }
  }

  function handleCancelImport() {
    if (importing) return;
    setImportPreview(null);
    setImportError(null);
    setImportProgress('');
  }

  async function handleDeleteAll() {
    setDeleting(true);
    try {
      await deleteAllMyData();
    } catch (e) {
      console.error(e);
      toast.error(
        'No se pudo borrar la cuenta',
        'Contacta con soporte si el problema persiste.'
      );
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ---------- HEADER ---------- */}
      <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-4 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-grad-brand text-white shadow-glow-blue">
            <UserIcon size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-100">
              {profile.email ?? 'Usuario'}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">{memberSince}</p>
          </div>
        </div>
      </div>

      {/* ---------- RACHA ---------- */}
      {streakCurrent > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-zinc-950 p-4">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 text-[140px] opacity-10"
          >
            🔥
          </span>
          <div className="relative flex items-center gap-3">
            <Flame size={32} className="shrink-0 text-orange-400" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest text-orange-300">
                Racha actual
              </p>
              <p className="text-2xl font-extrabold tabular-nums text-zinc-100">
                {streakCurrent} {streakCurrent === 1 ? 'día' : 'días'}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Máximo histórico: {streakBest} ·{' '}
                {totalDays} {totalDays === 1 ? 'día' : 'días'} en total
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------- ESTADÍSTICAS ---------- */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox
          icon={<Dumbbell size={14} className="text-blue-400" />}
          label="Sesiones"
          value={stats.loading ? '—' : String(stats.sessions)}
        />
        <StatBox
          icon={<TrendingUp size={14} className="text-cyan-400" />}
          label="kg movidos"
          value={
            stats.loading ? '—' : stats.volume.toLocaleString('es-ES')
          }
        />
        <StatBox
          icon={<Trophy size={14} className="text-amber-400" />}
          label="PRs"
          value={stats.loading ? '—' : String(stats.prs)}
        />
      </div>

      {/* ---------- SUGERENCIA PERFIL INCOMPLETO ---------- */}
      {profileIncomplete && (
        <button
          onClick={onOpenPreferences}
          className="flex w-full items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-left transition-colors hover:bg-amber-500/10"
        >
          <AlertTriangle size={16} className="shrink-0 text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-300">
              Perfil incompleto
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
              Rellena edad, altura, peso y material para obtener
              recomendaciones precisas.
            </p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-amber-400" />
        </button>
      )}

      {/* ---------- DATOS PERSONALES ---------- */}
      <Section title="Datos personales">
        <div className="grid grid-cols-2 gap-2">
          <InfoBox label="Edad" value={profile.age ? `${profile.age} años` : '—'} />
          <InfoBox label="Género" value={profile.gender ?? '—'} />
          <InfoBox
            label="Peso"
            value={profile.weightKg ? `${profile.weightKg} kg` : '—'}
          />
          <InfoBox
            label="Altura"
            value={profile.heightCm ? `${profile.heightCm} cm` : '—'}
          />
        </div>
      </Section>

      {/* ---------- TDEE ---------- */}
      {kcal !== null && (
        <Section title="Gasto calórico (TDEE)">
          <div className="grid grid-cols-3 gap-2">
            <KcalCard label="Mantenimiento" value={kcal} highlight />
            <KcalCard label="Déficit" value={kcal - 500} />
            <KcalCard label="Volumen" value={kcal + 300} />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
            Calculado con la fórmula Mifflin-St Jeor. Ajusta según tu
            evolución real (±200 kcal cada 2 semanas).
          </p>
        </Section>
      )}

      {/* ---------- REGISTRAR PESO ---------- */}
      <Section title="Registrar peso corporal">
        <div className="flex gap-2">
          <input
            value={bwInput}
            onChange={(e) => setBwInput(e.target.value)}
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="Ej. 78.5"
            className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500"
          />
          <button
            onClick={saveBodyweight}
            disabled={savingBw || !bwInput}
            className="flex items-center gap-1.5 rounded-2xl bg-grad-brand px-4 text-sm font-semibold text-white shadow-cta transition-all duration-200 hover:shadow-cta-hover active:scale-[0.97] disabled:opacity-50"
          >
            {savingBw ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Guardar
          </button>
        </div>
      </Section>

      {/* ---------- ACTIVIDAD ---------- */}
      <Section title="Nivel de actividad">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-3">
          <Activity size={16} className="shrink-0 text-cyan-400" />
          <p className="text-sm font-semibold text-zinc-100">
            {profile.activityLevel ?? 'No definido'}
          </p>
        </div>
      </Section>

      {/* ---------- MATERIAL ---------- */}
      <Section title="Material disponible">
        {profile.availableEquipment.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {profile.availableEquipment.map((eq) => (
              <span
                key={eq}
                className="rounded-full border border-blue-500/40 bg-gradient-to-r from-blue-500/15 to-cyan-400/15 px-3 py-1 text-[11px] text-blue-300"
              >
                {eq}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500">Sin material seleccionado.</p>
        )}
      </Section>

      {/* ---------- PREFERENCIAS ---------- */}
      <Section title="Ajustes">
        <MenuButton
          icon={<Settings size={16} className="text-cyan-400" />}
          label="Preferencias de entrenamiento"
          description="Modo, disciplinas, técnicas, volumen"
          onClick={onOpenPreferences}
        />
      </Section>

      {/* ---------- DATOS Y PRIVACIDAD ---------- */}
      <Section title="Datos y privacidad">
        <MenuButton
          icon={<Download size={16} className="text-blue-400" />}
          label="Exportar mi backup"
          description="Descarga todos tus datos en un archivo JSON"
          loading={exporting}
          onClick={handleExport}
        />
        <MenuButton
          icon={<Upload size={16} className="text-cyan-400" />}
          label="Importar backup"
          description="Restaura tus datos desde un archivo JSON"
          loading={importing}
          onClick={handleImportClick}
        />
        <MenuButton
          icon={<Trash2 size={16} className="text-red-400" />}
          label="Borrar cuenta y todos mis datos"
          description="Acción irreversible (GDPR)"
          onClick={() => setShowDeleteConfirm(true)}
          danger
        />
      </Section>

      {/* ---------- ACERCA DE ---------- */}
      <Section title="Acerca de">
        <div className="space-y-2">
          <MenuButton
            icon={<Info size={16} className="text-zinc-400" />}
            label="Versión de MyTraining"
            description={`v${APP_VERSION} · PWA + Android`}
            disabled
          />
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=MyTraining%20-%20Feedback`}
            className="flex items-center gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-3 transition-colors hover:border-zinc-700"
          >
            <MessageCircle size={16} className="shrink-0 text-cyan-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-200">
                Enviar sugerencias
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Cuéntanos qué mejorarías o qué falta
              </p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-zinc-600" />
          </a>
        </div>
      </Section>

      {/* ---------- CERRAR SESIÓN ---------- */}
      <button
        onClick={() => supabase.auth.signOut()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
      >
        <LogOut size={14} /> Cerrar sesión
      </button>

      {/* ---------- INPUT FILE OCULTO (importación) ---------- */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* ---------- MODAL IMPORTAR BACKUP ---------- */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl border-t border-cyan-500/30 bg-zinc-950 p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-cyan-200">
                Importar backup
              </h2>
              <button
                onClick={handleCancelImport}
                disabled={importing}
                className="text-zinc-500 disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nombre + fecha del archivo */}
            <div className="mb-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-3">
              <p className="truncate text-xs font-medium text-zinc-200">
                {importPreview.file.name}
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-500">
                Exportado el{' '}
                {new Date(importPreview.preview.exportedAt).toLocaleString(
                  'es-ES'
                )}
              </p>
            </div>

            {/* Conteos */}
            <div className="mb-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Contenido
              </p>
              <ul className="space-y-1 text-[11px] text-zinc-300">
                <li className="flex justify-between">
                  <span>Rutinas</span>
                  <span className="tabular-nums text-zinc-100">
                    {importPreview.preview.counts.routines}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Ejercicios de rutina</span>
                  <span className="tabular-nums text-zinc-100">
                    {importPreview.preview.counts.routineExercises}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Entrenamientos</span>
                  <span className="tabular-nums text-zinc-100">
                    {importPreview.preview.counts.workouts}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Series registradas</span>
                  <span className="tabular-nums text-zinc-100">
                    {importPreview.preview.counts.workoutSets}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Registros de peso</span>
                  <span className="tabular-nums text-zinc-100">
                    {importPreview.preview.counts.bodyweightLogs}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Ejercicios personalizados</span>
                  <span className="tabular-nums text-zinc-100">
                    {importPreview.preview.counts.customExercises}
                  </span>
                </li>
              </ul>
            </div>

            {/* Advertencia destructiva */}
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0 text-amber-400"
                />
                <p className="text-[11px] leading-relaxed text-amber-200">
                  Se borrarán <b>todos tus datos actuales</b> antes de
                  importar (excepto tu cuenta y tu email). Esta acción no se
                  puede deshacer.
                </p>
              </div>
            </div>

            {/* Progreso durante la importación */}
            {importing && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-3">
                <Loader2 size={14} className="animate-spin text-cyan-400" />
                <p className="text-[11px] text-cyan-200">
                  {importProgress || 'Importando…'}
                </p>
              </div>
            )}

            {/* Error */}
            {importError && (
              <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    size={16}
                    className="mt-0.5 shrink-0 text-red-400"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-red-300">
                      Error al importar
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-red-200/80">
                      {importError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={handleCancelImport}
                disabled={importing}
                className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 py-3 text-sm font-semibold text-zinc-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-200 disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {importing ? 'Importando…' : 'Sí, importar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL BORRAR CUENTA ---------- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md animate-scale-in rounded-t-3xl border-t border-red-500/30 bg-zinc-950 p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-red-300">
                Borrar cuenta y datos
              </h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-zinc-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0 text-red-400"
                />
                <p className="text-xs leading-relaxed text-red-200">
                  Se borrarán permanentemente:
                </p>
              </div>
              <ul className="mt-2 space-y-0.5 pl-6 text-[11px] leading-relaxed text-zinc-300">
                <li>• Tu perfil y credenciales de acceso</li>
                <li>• Todas tus rutinas y planes</li>
                <li>• Todo tu historial de entrenamientos</li>
                <li>• Todos los PRs y estadísticas</li>
                <li>• Los ejercicios personalizados que hayas creado</li>
              </ul>
              <p className="mt-2 text-[11px] text-red-300">
                Esta acción no se puede deshacer.
              </p>
            </div>

            <p className="mb-2 text-xs text-zinc-400">
              Si quieres conservar tus datos, expórtalos antes con el botón
              "Exportar mi backup".
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 py-3 text-sm font-semibold text-zinc-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 py-3 text-sm font-semibold text-red-300 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {deleting ? 'Borrando…' : 'Borrar todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Sub-componentes
// ===========================================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        {title}
      </p>
      {children}
    </section>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-3">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function KcalCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 text-center ${
        highlight
          ? 'border-blue-500/40 bg-gradient-to-br from-blue-500/10 to-cyan-400/5'
          : 'border-zinc-800/70 bg-zinc-950/60'
      }`}
    >
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className="mt-1 text-base font-bold tabular-nums text-zinc-100">
        {value}
      </p>
      <p className="text-[10px] text-zinc-600">kcal</p>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-3 text-center shadow-card">
      <div className="mb-1 flex justify-center">{icon}</div>
      <p className="text-base font-bold tabular-nums text-zinc-100">{value}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  );
}

function MenuButton({
  icon,
  label,
  description,
  onClick,
  loading,
  disabled,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  const baseCls = `flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
    danger
      ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
      : 'border-zinc-800/60 bg-zinc-900/60 hover:border-zinc-700'
  } ${disabled ? 'cursor-default opacity-70' : ''}`;

  const content = (
    <>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            danger ? 'text-red-300' : 'text-zinc-200'
          }`}
        >
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-[11px] text-zinc-500">{description}</p>
        )}
      </div>
      {loading ? (
        <Loader2 size={16} className="shrink-0 animate-spin text-cyan-400" />
      ) : !disabled ? (
        <ChevronRight size={16} className="shrink-0 text-zinc-600" />
      ) : null}
    </>
  );

  if (disabled || !onClick) {
    return <div className={baseCls}>{content}</div>;
  }
  return (
    <button onClick={onClick} className={baseCls}>
      {content}
    </button>
  );
}