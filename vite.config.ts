import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/yf/v1': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yf/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SIBA/1.0)',
          'Accept': 'application/json',
        },
      },
      '/yf': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yf/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SIBA/1.0)',
        },
      },
      '/sectors': {
        target: 'https://api.sectors.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sectors/, ''),
      },
      // Telebot bridge — proxied to the local Python bot server (bot/main.py).
      // Start it with: cd bot && python main.py
      // The bot token never enters the browser bundle.
      '/bot-api': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/bot-api/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
