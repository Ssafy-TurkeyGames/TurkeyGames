// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

function createWindow() {
  // 대시보드 웹 (React) - 브라우저에서 직접 접속
  // http://localhost:3000

  // 게임보드 창 생성
  const gameboard = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: false, // 보안 강화
      contextIsolation: true, // 보안 강화
      preload: path.join(__dirname, 'preload.js') // 중요: .js로 경로 지정
    }
  });

  // IPC 핸들러 추가 예시
  ipcMain.handle('start-game', (event, gameData) => {
    console.log('게임 시작 데이터:', gameData);
    return { status: 'success' };
  });

  // 개발 모드
  if (process.env.NODE_ENV === 'development') {
    gameboard.loadURL('http://localhost:3001'); // 개발 모드
  } else {
    gameboard.loadFile(path.join(__dirname, 'gameboard', 'index.html')); // 프로덕션 모드
  }
}

app.whenReady().then(createWindow);
