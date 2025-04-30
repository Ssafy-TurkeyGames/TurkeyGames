// electron/preload.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // 렌더러 → 메인 통신
  send: (channel: string, data?: any) => {
    ipcRenderer.send(channel, data);
  },
  
  // 메인 → 렌더러 통신 수신
  on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.on(channel, listener);
  },

  // 메인 프로세스와 양방향 통신
  invoke: (channel: string, data?: any) => {
    return ipcRenderer.invoke(channel, data);
  },

  // 보안을 위해 선택적 API만 노출
  platform: process.platform
});
