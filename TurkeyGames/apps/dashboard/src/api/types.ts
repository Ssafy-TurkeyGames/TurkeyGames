// apps/dashboard/src/api/types.ts

// API 응답 공통 인터페이스
export interface ApiResponse<T> {
    code: string;
    message: string;
    data: T;
  }
  
  // 게임 관련 타입
  export interface Game {
    gameId: number;
    title: string;
    description: string;
    gameProfilePath: string;
    people: number[];
    level: number;
  }
  
  // 게임 규칙 인터페이스 추가
export interface GameRule {
    gameId: number;
    gameProfilePath: string;
    description: string;
    imagePath: string;
    descriptionVideoPath: string;
  }

  // 하이라이트 데이터 인터페이스
export interface HighlightData {
  local_path?: string;
  minio_path?: string;
  qr_code?: string;
  local_qr_path?: string;
  minio_qr_path?: string;
}