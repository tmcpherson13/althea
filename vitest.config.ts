import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Unit tests cover pure logic (src/lib) only — no React Native imports there,
// so tests run in plain Node without a simulator.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
