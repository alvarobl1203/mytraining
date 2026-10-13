import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ===========================================================================
// MyTraining — Configuración de Vite
// ===========================================================================
// Optimización del bundle:
//   - chunkSizeWarningLimit subido a 800 kB (con jspdf no baja de ahí)
//   - manualChunks para separar vendors pesados y mejorar la caché
//   - jspdf + html2canvas + dompurify se cargan bajo demanda desde
//     ExportSheet / PlanExportSheet con import() dinámico
// ===========================================================================
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'recharts': ['recharts'],
          'jspdf': ['jspdf'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
});