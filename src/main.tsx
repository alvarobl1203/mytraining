import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastProvider } from './lib/ui/ToastProvider';
import { ConfirmProvider } from './lib/ui/ConfirmProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

// ---------------------------------------------------------------------------
// Root render
// ---------------------------------------------------------------------------
// El ErrorBoundary va lo más arriba posible (por fuera de los providers)
// para capturar errores de renderizado de toda la app, incluidos los que
// ocurran en ToastProvider / ConfirmProvider / App.
//
// Nota: los errores lanzados dentro de un event handler (onClick, etc.)
// NO los captura el ErrorBoundary. Esos los cubre el try/catch + toast
// que ya tenemos en cada handler.
// ---------------------------------------------------------------------------
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

// ---------------------------------------------------------------------------
// Service Worker (PWA)
// ---------------------------------------------------------------------------
// Registro en producción. En desarrollo no se registra para evitar que un
// SW antiguo sirva assets cacheados mientras trabajas.
// ---------------------------------------------------------------------------
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => {
        console.warn('[SW] No se pudo registrar:', err);
      });
  });
}