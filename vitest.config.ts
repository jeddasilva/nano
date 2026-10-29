import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      lib: path.resolve(__dirname, './lib'),
      db: path.resolve(__dirname, './db'),
      components: path.resolve(__dirname, './components'),
      'server-actions': path.resolve(__dirname, './server-actions')
    }
  }
});
