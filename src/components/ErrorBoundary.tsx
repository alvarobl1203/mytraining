// ===========================================================================
// MyTraining — ErrorBoundary global
// ===========================================================================
// Captura cualquier error de renderizado en el árbol de React y muestra
// una pantalla de fallback en dark mode con opción de reintentar o recargar.
//
// Uso en main.tsx:
//   <ErrorBoundary>
//     <App />
//   </ErrorBoundary>
// ===========================================================================

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Callback opcional que se ejecuta al capturar un error. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log en consola para que aparezca en Sentry (cuando se integre)
    console.error('[ErrorBoundary] Error capturado:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    const { error, errorInfo } = this.state;

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-6 shadow-card">
          {/* Cabecera */}
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-500/10 p-2">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h1 className="text-lg font-semibold">Algo ha ido mal</h1>
          </div>

          {/* Mensaje */}
          <p className="text-sm leading-relaxed text-zinc-400">
            MyTraining ha encontrado un error inesperado. Puedes intentar
            recuperar la pantalla o recargar la aplicación por completo.
          </p>

          {/* Detalles técnicos colapsables */}
          {error && (
            <details className="rounded-lg border border-zinc-800/60 bg-zinc-950/60 p-3 text-xs text-zinc-500">
              <summary className="cursor-pointer select-none text-zinc-400">
                Detalles técnicos
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed">
                {error.name}: {error.message}
                {errorInfo?.componentStack
                  ? `\n\n${errorInfo.componentStack}`
                  : ''}
              </pre>
            </details>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-800/70 bg-zinc-900/40 px-4 py-3 text-sm font-medium text-zinc-200 transition active:scale-[0.98]"
            >
              <RotateCcw size={14} />
              Reintentar
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
            >
              <RefreshCw size={14} />
              Recargar
            </button>
          </div>
        </div>
      </div>
    );
  }
}