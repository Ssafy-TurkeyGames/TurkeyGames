import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    outDir: '../../dist/gameboard',
    emptyOutDir: true, // 1. 빌드 시 출력 디렉토리 초기화
  },
  base: './'   // ★ 이 줄을 반드시 추가!
})