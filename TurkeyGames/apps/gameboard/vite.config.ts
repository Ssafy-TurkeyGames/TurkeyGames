import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: '/gameboard/', // ✅ 반드시 최상단에 위치해야 함
  build: {
    outDir: '../../dist/gameboard',
    emptyOutDir: true,
  },
});
