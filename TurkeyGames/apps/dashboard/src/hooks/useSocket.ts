// hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:8000' // 경록님 ip임. 실제 서버 URL로 변경해야 함.

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 소켓 연결 생성
    const socketInstance = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'], // 연결 실패할 경우 polling으로 폴백
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000, // 타임아웃 시간 증가
    });

    // 연결 이벤트 핸들러
    socketInstance.on('connect', () => {
      console.log('소켓 서버에 연결됨');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('소켓 서버 연결 끊김');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
        console.error('연결 오류:', error);
        // 사용자에게 연결 오류 알림
        if (process.env.NODE_ENV === 'development') {
          console.log('서버 URL 확인:', SOCKET_SERVER_URL);
        }
      });

    setSocket(socketInstance);

    // 컴포넌트 언마운트 시 소켓 연결 정리
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
}
