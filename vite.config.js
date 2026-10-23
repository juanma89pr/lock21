import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // El trozo de /app lleva Firebase (~600 kB sin comprimir); la portada no lo carga.
  build: { chunkSizeWarningLimit: 700 }
});
