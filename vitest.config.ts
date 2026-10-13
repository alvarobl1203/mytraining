import { defineConfig } from 'vitest/config';

// ===========================================================================
// MyTraining — Configuración de Vitest
// ===========================================================================
// Archivo INDEPENDIENTE de vite.config.ts:
//   - vite.config.ts → build de producción (manualChunks, chunkSizeWarningLimit)
//   - vitest.config.ts → ejecución de tests unitarios
//
// No se toca vite.config.ts para no mezclar responsabilidades.
// ===========================================================================
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'android'],
    globals: false,
    // Si no hay tests todavía, no falla el comando (exit 0 en vez de 1)
    passWithNoTests: true,
  },
});