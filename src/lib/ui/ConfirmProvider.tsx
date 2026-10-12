import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface State extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);

  const confirm = useCallback<ConfirmContextValue['confirm']>(
    (opts) =>
      new Promise<boolean>((resolve) => {
        setState({ ...opts, resolve });
      }),
    []
  );

  function close(result: boolean) {
    if (state) {
      state.resolve(result);
      setState(null);
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-scale-in rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
            <div className="mb-3 flex items-start gap-3">
              {state.danger && (
                <AlertTriangle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-400"
                />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-zinc-100">
                  {state.title}
                </h3>
                {state.description && (
                  <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-zinc-400">
                    {state.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => close(false)}
                className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700"
              >
                {state.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                onClick={() => close(true)}
                className={`flex-1 rounded-2xl py-2.5 text-sm font-semibold text-white shadow-cta transition-all duration-200 active:scale-[0.98] ${
                  state.danger
                    ? 'bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/20'
                    : 'bg-grad-brand'
                }`}
              >
                {state.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue['confirm'] {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  }
  return ctx.confirm;
}