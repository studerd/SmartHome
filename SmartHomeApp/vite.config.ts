// vite.config.ts (à la racine ou dans le dossier de l’app)
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: { exclude: ['onnxruntime-web'] },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});
