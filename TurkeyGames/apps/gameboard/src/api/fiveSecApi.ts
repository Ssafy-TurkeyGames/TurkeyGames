// src/services/fiveSecApi.ts

const API_URL = 'http://localhost:8000/fivesec';

export interface GameState {
  id: string;
  players: string[];
  current_player_idx: number;
  scores: { [key: string]: number };
  round: number;
  max_rounds: number;
  status: string;
}

export interface StartGameRequest {
  people: number;
  round: number;
  voice?: number;
}

export interface UpdateScoreRequest {
  player_id: string;
  score: number;
}

export const fiveSecApi = {
  // 게임 시작
  async startGame(players: number, rounds: number, voice: number = 1): Promise<GameState> {
    const response = await fetch(`${API_URL}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        people: players,
        round: rounds,
        voice: voice,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }
    
    return response.json();
  },

  // 게임 상태 조회
  async getGameState(gameId: string): Promise<GameState> {
    const response = await fetch(`${API_URL}/${gameId}`);
    
    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }
    
    return response.json();
  },

  // 점수 업데이트
  async updateScore(gameId: string, playerId: string, score: number): Promise<any> {
    const response = await fetch(`${API_URL}/${gameId}/update-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player_id: playerId,
        score: score,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }
    
    return response.json();
  },

  // 다음 턴
  async nextTurn(gameId: string): Promise<GameState> {
    const response = await fetch(`${API_URL}/${gameId}/next-turn`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }
    
    return response.json();
  },

  // 게임 종료
  async endGame(gameId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/${gameId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }
    
    return response.json();
  },

  // 최종 점수
  async getFinalScores(gameId: string): Promise<{ [key: string]: number }> {
    const response = await fetch(`${API_URL}/${gameId}/final-scores`);
    
    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }
    
    return response.json();
  },

  // 게임 데이터 삭제
  async cleanupGame(gameId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/${gameId}/cleanup`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }
    
    return response.json();
  },
};