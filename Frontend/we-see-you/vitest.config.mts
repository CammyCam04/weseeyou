import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: [
      'unit-test/**/*.test.{ts,tsx}',
      'unit-test/**/*-test.{ts,tsx}',
      'unit-test/**/*.{spec,test}.{ts,tsx}'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './')
    }
  }
});
