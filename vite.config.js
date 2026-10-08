import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Two renderer entry points: the browser chrome (tab bar + address bar)
// and the new-tab dashboard. base './' keeps file:// loads working.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        chrome: 'chrome.html',
        dashboard: 'dashboard.html',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
