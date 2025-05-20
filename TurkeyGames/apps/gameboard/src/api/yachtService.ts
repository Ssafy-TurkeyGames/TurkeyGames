// app/api/yachtService.ts
import { apiRequest } from './axiosConfig';

// 게임 설정 인터페이스
export interface GameSettings {
  people: number;
  map: number;
  voice: number;
}

// 플레이어 인터페이스
export interface Player {
  id: string;
  name?: string;
  scorecard: Record<string, number | null>;
  total_score: number;
}

// 게임 상태 인터페이스
export interface GameStatus {
  id: string;
  current_player_idx: number;
  dice_values: number[];
  rolls_left: number;
  players: string[];
  is_finished?: boolean;
}

// 점수 업데이트 인터페이스
export interface ScoreUpdate {
  current_player_idx?: number;
  dice_values?: number[];
  is_finished?: boolean;
  next_player?: number;
  rolls_left?: number;
  scores?: Player[];
}

// 점수 선택 요청 인터페이스
export interface ScoreSelectRequest {
  player_id: number;
  category: string;
  value: number;
}

// 주사위 굴림 요청 인터페이스
export interface DiceRollRequest {
  keep_indices: number[];
}

// 점수 응답 인터페이스
export interface ScoresResponse {
  scores: Player[];
}

// 하이라이트 응답 인터페이스
export interface HighlightResponse {
  local_path: string;
  minio_path: string;
  qr_code: string;
  local_qr_path: string;
}

// 야추 게임 API 서비스
const yachtService = {
  // 게임 시작
  startGame: (settings: GameSettings): Promise<GameStatus> => {
    return apiRequest.post<GameStatus>('/yacht/start', settings);
  },
  
  // 게임 상태 조회
  getGameStatus: (gameId: string): Promise<GameStatus> => {
    return apiRequest.get<GameStatus>(`/yacht/${gameId}/status`);
  },
  
  // 주사위 굴리기
  rollDice: (gameId: string): Promise<{
    dice_values: number[];
    rolls_left: number;
  }> => {
    return apiRequest.post(`/yacht/${gameId}/roll`);
  },
  
  // 점수 선택
  selectScore: (gameId: string, request: ScoreSelectRequest): Promise<{
    next_player: number;
  }> => {
    return apiRequest.post(`/yacht/${gameId}/select`, request);
  },
  
  // 점수표 조회
  getScores: (gameId: string): Promise<ScoresResponse> => {
    return apiRequest.get<ScoresResponse>(`/yacht/${gameId}/scores`);
  },

  // 게임 삭제
  endGame: (gameId: string): Promise<{
    message: string;
  }> => {
    return apiRequest.delete(`/yacht/${gameId}`);
  },

  // 게임 종료
  endGameNotice: (gameId: string) : Promise<{
    message: string;
  }> => {
    return apiRequest.post(`/yacht/end/${gameId}`);
  },

  // 하이라이트 영상 조회
  getHighlight: (gameId: string, playerId: string): Promise<HighlightResponse> => {
  return apiRequest.get<HighlightResponse>(`/highlight/${gameId}/${playerId}`);
  },
};

export default yachtService;
