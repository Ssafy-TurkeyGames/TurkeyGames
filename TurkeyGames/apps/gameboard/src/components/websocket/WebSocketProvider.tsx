// components/websocket/GameWebSocketProvider.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket, io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import yachtService, { 
  GameSettings, 
  GameStatus, 
  Player, 
  ScoreUpdate 
} from '../../api/yachtService';

// WebSocket 컨텍스트 인터페이스
interface GameWebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  gameData: GameStatus | null;
  setGameData: React.Dispatch<React.SetStateAction<GameStatus | null>>;
  connectSocket: () => void;
  joinGame: (gameId: string) => void;
  startGame: (settings: GameSettings) => Promise<void>;
  rollDice: (keepIndices: number[]) => Promise<void>;
  selectScore: (playerId: string, category: string, value: number) => Promise<void>;
  getGameStatus: () => Promise<void>;
  getScores: () => Promise<void>;
  endGame: () => Promise<void>;
  API_URL: string;
}

// WebSocket 프로바이더 Props 인터페이스
interface GameWebSocketProviderProps {
  children: ReactNode;
}

// API URL 설정
const API_URL = 'http://localhost:8000';

// WebSocket 컨텍스트 생성
const GameWebSocketContext = createContext<GameWebSocketContextType | null>(null);

// WebSocket 컨텍스트를 사용하기 위한 Hook
export const useGameWebSocket = (): GameWebSocketContextType => {
  const context = useContext(GameWebSocketContext);
  if (!context) {
    throw new Error('useGameWebSocket must be used within a GameWebSocketProvider');
  }
  return context;
};

export const GameWebSocketProvider: React.FC<GameWebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [gameData, setGameData] = useState<GameStatus | null>(null);
  const navigate = useNavigate();

  // 소켓 연결 함수
  const connectSocket = (): void => {
    if (socket && socket.connected) {
      console.log("이미 연결되어 있습니다.");
      return;
    }

    // 기존 소켓 정리
    if (socket) {
      socket.close();
    }

    console.log("서버 연결 시도 중...");
    const newSocket = io(API_URL, {
      autoConnect: true,
      reconnection: true,
      transports: ["websocket"],
    });

    setSocket(newSocket);
  };

  // 게임 참가 함수
  const joinGame = (gameId: string): void => {
    if (!socket || !socket.connected) {
      console.log("먼저 연결하세요");
      return;
    }
    
    console.log("게임 참가 요청 전송...");
    socket.emit("join_game", { game_id: gameId }, (result: any) => {
      console.log(`게임 참여 결과: ${JSON.stringify(result)}`);
    });
  };

  // 게임 시작 함수 (axios 사용)
  const startGame = async (settings: GameSettings): Promise<void> => {
    try {
      console.log(`게임 시작 요청: ${JSON.stringify(settings)}`);
      const response = await yachtService.startGame(settings);
      console.log(`게임 시작 성공: ${JSON.stringify(response)}`);

      // 게임 데이터 저장
      setGameData(response);

      // 웹소켓 연결 및 게임 참여
      if (socket && isConnected) {
        joinGame(response.id);
      }

      // 맵 값에 따라 라우팅
      if (settings.map === 0) {
        navigate('/gameboard/turkey_dice', { state: { gameData: response } });
      } else {
        navigate(`/map-type-${settings.map}`, { state: { gameData: response } });
      }
    } catch (error) {
      console.error(`게임 시작 오류: ${error}`);
      throw error;
    }
  };

  // 주사위 굴리기 함수 (axios 사용)
  const rollDice = async (keepIndices: number[]): Promise<void> => {
    if (!gameData || !gameData.id) {
      console.error("게임 ID가 없습니다.");
      return;
    }

    try {
      console.log(`주사위 굴리기 요청: 유지할 주사위 ${JSON.stringify(keepIndices)}`);
      const response = await yachtService.rollDice(gameData.id, { keep_indices: keepIndices });
      console.log(`주사위 굴림 결과: ${JSON.stringify(response)}`);

      // 게임 데이터 업데이트
      setGameData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          dice_values: response.dice_values,
          rolls_left: response.rolls_left,
        };
      });
    } catch (error) {
      console.error(`주사위 굴리기 오류: ${error}`);
      throw error;
    }
  };

  // 점수 선택 함수 (axios 사용)
  const selectScore = async (playerId: string, category: string, value: number): Promise<void> => {
    if (!gameData || !gameData.id) {
      console.error("게임 ID가 없습니다.");
      return;
    }

    try {
      console.log(`점수 선택 요청: 플레이어=${playerId}, 카테고리=${category}, 점수=${value}`);
      const response = await yachtService.selectScore(gameData.id, {
        player_id: playerId,
        category: category,
        value: value,
      });
      console.log(`점수 선택 결과: ${JSON.stringify(response)}`);

      // 게임 데이터 업데이트
      setGameData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          current_player_idx: response.next_player,
          dice_values: [0, 0, 0, 0, 0],
          rolls_left: 3,
        };
      });

      // 점수 조회 요청
      await getScores();
    } catch (error) {
      console.error(`점수 선택 오류: ${error}`);
      throw error;
    }
  };

  // 게임 상태 조회 함수 (axios 사용)
  const getGameStatus = async (): Promise<void> => {
    if (!gameData || !gameData.id) {
      console.error("게임 ID가 없습니다.");
      return;
    }

    try {
      console.log(`게임 상태 조회 요청: ${gameData.id}`);
      const response = await yachtService.getGameStatus(gameData.id);
      console.log(`게임 상태: ${JSON.stringify(response)}`);

      // 게임 데이터 업데이트
      setGameData(prevData => {
        if (!prevData) return response;
        return {
          ...prevData,
          current_player_idx: response.current_player_idx,
          dice_values: response.dice_values,
          rolls_left: response.rolls_left,
        };
      });
    } catch (error) {
      console.error(`게임 상태 조회 오류: ${error}`);
      throw error;
    }
  };

  // 점수 조회 함수 (axios 사용)
  const getScores = async (): Promise<void> => {
    if (!gameData || !gameData.id) {
      console.error("게임 ID가 없습니다.");
      return;
    }

    try {
      console.log(`점수표 조회 요청: ${gameData.id}`);
      const response = await yachtService.getScores(gameData.id);
      console.log(`점수표: ${JSON.stringify(response)}`);

      // 게임 데이터 업데이트
      setGameData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          scores: response.scores,
        };
      });
    } catch (error) {
      console.error(`점수표 조회 오류: ${error}`);
      throw error;
    }
  };

  // 게임 종료 함수 (axios 사용)
  const endGame = async (): Promise<void> => {
    if (!gameData || !gameData.id) {
      console.error("게임 ID가 없습니다.");
      return;
    }

    try {
      console.log(`게임 종료 요청: ${gameData.id}`);
      const response = await yachtService.endGame(gameData.id);
      console.log(`게임 종료 결과: ${JSON.stringify(response)}`);

      // 소켓 연결 해제
      if (socket && isConnected) {
        socket.emit("leave_game", { game_id: gameData.id }, (result: any) => {
          console.log(`게임 나가기 결과: ${JSON.stringify(result)}`);
        });
      }

      // 게임 데이터 초기화
      setGameData(null);

      // 기본 페이지로 이동
      navigate('/');
    } catch (error) {
      console.error(`게임 종료 오류: ${error}`);
      throw error;
    }
  };

  // 소켓 연결 및 이벤트 설정
  useEffect(() => {
    // 초기 연결
    connectSocket();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []); // 마운트 시에만 실행

  // 소켓 이벤트 핸들러 설정
  useEffect(() => {
    if (!socket) return;

    // 연결 이벤트
    const onConnect = () => {
      console.log("Socket.IO 서버에 연결되었습니다.");
      setIsConnected(true);
    };

    // 연결 해제 이벤트
    const onDisconnect = () => {
      console.log("Socket.IO 서버 연결이 끊어졌습니다.");
      setIsConnected(false);
    };

    // 연결 성공 메시지
    const onConnectionSuccess = (data: { message: string }) => {
      console.log(`서버 메시지: ${data.message}`);
    };

    // 점수 업데이트 이벤트
    const onScoreUpdate = (data: ScoreUpdate) => {
      console.log(`점수 업데이트 수신: ${JSON.stringify(data)}`);

      // 게임 데이터 업데이트
      setGameData(prevData => {
        if (!prevData) return null;
        
        const newData = { ...prevData };
        
        if (data.is_finished) {
          newData.is_finished = true;
        }
        
        if (data.current_player_idx !== undefined) {
          newData.current_player_idx = data.current_player_idx;
        }
        
        if (data.dice_values) {
          newData.dice_values = data.dice_values;
        }
        
        if (data.rolls_left !== undefined) {
          newData.rolls_left = data.rolls_left;
        }
        
        if (data.scores !== undefined) {
          newData.scores = data.scores;
        }
        
        return newData;
      });
    };

    // 게임 생성 이벤트 - 여기서 자동 라우팅 처리
    const onGameCreated = (data: any) => {
      console.log(`게임 생성 이벤트: ${JSON.stringify(data)}`);
      
      // 게임 설정이 있는 경우 라우팅
      if (data.settings && typeof data.settings.map === 'number') {
        // map이 0이면 turkey_dice로 라우팅
        if (data.settings.map === 0) {
          console.log('Map 0 감지: turkey_dice로 라우팅합니다.');
          navigate('/gameboard/turkey_dice', { 
            state: { gameData: data }
          });
        } else {
          // 다른 맵 값에 따른 라우팅 처리
          console.log(`Map ${data.settings.map} 감지: map-type-${data.settings.map}로 라우팅합니다.`);
          navigate(`/map-type-${data.settings.map}`, { 
            state: { gameData: data }
          });
        }
      }
    };

    // 이벤트 리스너 등록
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connection_success", onConnectionSuccess);
    socket.on("score_update", onScoreUpdate);
    socket.on("game_created", onGameCreated);

    console.log("웹소켓 이벤트 리스너가 등록되었습니다.");

    // 컴포넌트 언마운트 또는 소켓 변경 시 이벤트 리스너 제거
    return () => {
      console.log("웹소켓 이벤트 리스너를 제거합니다.");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connection_success", onConnectionSuccess);
      socket.off("score_update", onScoreUpdate);
      socket.off("game_created", onGameCreated);
    };
  }, [socket, navigate]); // 소켓과 네비게이터 의존성 추가

  // Context Provider를 통해 소켓과 관련 함수들을 제공
  return (
    <GameWebSocketContext.Provider
      value={{
        socket,
        isConnected,
        gameData,
        setGameData,
        connectSocket,
        joinGame,
        startGame,
        rollDice,
        selectScore,
        getGameStatus,
        getScores,
        endGame,
        API_URL
      }}
    >
      {children}
    </GameWebSocketContext.Provider>
  );
};