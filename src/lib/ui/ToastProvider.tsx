import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
} from 'lucide-react';

type ToastKind = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  duration: number;
}

interface ToastContextValue {
  showToast: (
    kind: ToastKind,
    title: string,
    description?: string,
    duration?: number
  ) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_STYLES: Record<
  ToastKind,
  {
    ring: string;
    bg: string;
    icon: typeof Info;
    iconColor: string;
    titleColor: string;
  }
> = {
  success: {
    ring: 'border-emerald-500/40',
    bg: 'bg-emerald-500/5',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    titleColor: 'text-emerald-200',
  },
  error: {
    ring: 'border-red-500/40',
    bg: 'bg-red-500/5',
    icon: XCircle,
    iconColor: 'text-red-400',
    titleColor: 'text-red-200',
  },
  warning: {
    ring: 'border-amber-500/40',
    bg: 'bg-amber-500/5',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-200',
  },
  info: {
    ring: 'border-cyan-500/40',
    bg: 'bg-cyan-500/5',
    icon: Info,
    iconColor: 'text-cyan-400',
    titleColor: 'text-cyan-200',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback<ToastContextValue['showToast']>(
    (kind, title, description, duration = 3200) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [
        ...prev.slice(-2),
        { id, kind, title, description, duration },
      ]);
    },
    []
  );

  const value: ToastContextValue = {
    showToast,
    success: (t, d) => showToast('success', t, d),
    error: (t, d) => showToast('error', t, d, 4200),
    warning: (t, d) => showToast('warning', t, d, 3800),
    info: (t, d) => showToast('info', t, d),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const config = KIND_STYLES[toast.kind];
  const Icon = config.icon;

  useEffect(() => {
    const id = setTimeout(onClose, toast.duration);
    return () => clearTimeout(id);
  }, [toast.duration, onClose]);

  return (
    <div
      role="status"
      className={`pointer-events-auto w-full max-w-md animate-fade-in rounded-2xl border ${config.ring} ${config.bg} p-3 shadow-card backdrop-blur-xl`}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={18} className={`mt-0.5 shrink-0 ${config.iconColor}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${config.titleColor}`}>
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-300">
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return ctx;
}