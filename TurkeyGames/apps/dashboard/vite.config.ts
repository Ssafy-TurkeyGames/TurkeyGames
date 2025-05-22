import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// 환경에 따라 base 경로 분기
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: isProd ? '/dashboard/' : './', // 배포일 땐 절대경로, 개발일 땐 상대경로
  build: {
    outDir: '../../dist/dashboard',
    emptyOutDir: true,
  },
});
