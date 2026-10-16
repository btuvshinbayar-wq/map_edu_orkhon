import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: { include: ['test/ui/**/*.test.tsx'], environment: 'jsdom', setupFiles: ['test/ui/setup.ts'] },
});
