// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private currentGameId: string | null = null;

  connect(): void {
    if (!this.socket) {
      this.socket = io('http://localhost:8000', {
        path: '/socket.io/'
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      // 점수 업데이트 이벤트 리스너
      this.socket.on('score_update', (data) => {
        console.log('Score update received:', data);
        // Custom event 발생시켜서 React 컴포넌트에서 처리
        window.dispatchEvent(new CustomEvent('scoreUpdate', { detail: data }));
      });
    }
  }

  joinGame(gameId: string): void {
    if (this.socket && gameId) {
      this.currentGameId = gameId;
      this.socket.emit('join_game', { game_id: gameId }, (response: any) => {
        console.log('Join game response:', response);
      });
    }
  }

  leaveGame(): void {
    if (this.socket && this.currentGameId) {
      this.socket.emit('leave_game', { game_id: this.currentGameId }, (response: any) => {
        console.log('Leave game response:', response);
      });
      this.currentGameId = null;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.leaveGame();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();