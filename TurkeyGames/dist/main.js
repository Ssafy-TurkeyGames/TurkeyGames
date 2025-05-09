"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// electron/main.ts
const electron_1 = require("electron");
const path = __importStar(require("path"));
function createWindow() {
    // 게임보드 창 생성
    const gameboard = new electron_1.BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') // 중요: .js로 경로 지정
        }
    });
    // IPC 핸들러 추가 예시
    electron_1.ipcMain.handle('start-game', (event, gameData) => {
        console.log('게임 시작 데이터:', gameData);
        return { status: 'success' };
    });
    // 개발 모드
    if (process.env.NODE_ENV === 'development') {
        gameboard.loadURL('http://localhost:3001'); // 개발 모드
    }
    else {
        gameboard.loadFile(path.join(__dirname, 'gameboard', 'index.html')); // 프로덕션 모드
    }
}
electron_1.app.whenReady().then(createWindow);
