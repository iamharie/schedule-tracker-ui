import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Bind all interfaces so a phone on the same WiFi can reach the dev server
    // via the machine's LAN IP, not just localhost.
    host: true,
  },
});
