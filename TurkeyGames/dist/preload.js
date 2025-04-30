"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// electron/preload.ts
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // 렌더러 → 메인 통신
    send: (channel, data) => {
        electron_1.ipcRenderer.send(channel, data);
    },
    // 메인 → 렌더러 통신 수신
    on: (channel, listener) => {
        electron_1.ipcRenderer.on(channel, listener);
    },
    // 메인 프로세스와 양방향 통신
    invoke: (channel, data) => {
        return electron_1.ipcRenderer.invoke(channel, data);
    },
    // 보안을 위해 선택적 API만 노출
    platform: process.platform
});
