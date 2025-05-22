//app/dashboard/src/api/dashboardApi.ts

import axios from 'axios';
import axiosInstance from './axiosInstance';
import { ApiResponse, Game, GameRule, HighlightData } from './types';

// 소켓 서버 URL 추가
const SOCKET_SERVER_URL = 'http://localhost:8000';

// 모든 게임 목록 조회
export const getAllGames = async (forceRefresh = false): Promise<ApiResponse<Game[]>> => {
    // 강제 새로고침이 요청된 경우 캐시를 무시
    if (forceRefresh) {
      console.log('강제 새로고침 요청됨: 캐시 무시');
      getAllGames.cachedData = null;
    }
    
    // 이미 캐시된 데이터가 있으면 반환
    if (getAllGames.cachedData && !forceRefresh) {
      console.log('캐시된 데이터 사용:', getAllGames.cachedData);
      return getAllGames.cachedData;
    }
    
    // 이미 호출 중이면 진행 중인 프로미스 반환
    if (getAllGames.pendingPromise) {
      console.log('진행 중인 요청 재사용');
      return getAllGames.pendingPromise;
    }
    
    console.log('API 요청 URL:', `${axiosInstance.defaults.baseURL}/dashb`);
    
    // 새 요청 생성 및 저장
    getAllGames.pendingPromise = axiosInstance.get<ApiResponse<Game[]>>('/dashb', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
      .then(response => {
        console.log('API 응답:', response);
        // 응답 데이터 캐싱
        getAllGames.cachedData = response.data;
        getAllGames.pendingPromise = null;
        return response.data;
      })
      .catch(error => {
        getAllGames.pendingPromise = null;
        if (error.response) {
          console.error('서버 응답:', error.response.data);
        }
        throw error;
      });
    
    return getAllGames.pendingPromise;
};

// 정적 속성 추가
getAllGames.cachedData = null;
getAllGames.pendingPromise = null;

// 캐시 초기화 함수 추가
export const clearGameCache = () => {
  console.log('게임 캐시 초기화');
  getAllGames.cachedData = null;
  getAllGames.pendingPromise = null;
};

// 필터링된 게임 목록 조회
export const getFilteredGames = async (
    people?: number[],
    level?: number[]
  ): Promise<ApiResponse<Game[]>> => {
    const params = new URLSearchParams();

    params.append('people', people?.join(',') || '');
    params.append('level', level?.join(',') || '');
  
    const url = `/dashb/filter?${params.toString()}`;
    const response = await axiosInstance.get<ApiResponse<Game[]>>(url, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  };

// 키워드로 게임 검색
export const searchGamesByKeyword = async (keyword: string): Promise<ApiResponse<Game[]>> => {
  if (!keyword.trim()) {
    console.log('[DEBUG] 빈 키워드 감지, getAllGames() 호출');
    return getAllGames();
  }
    
  const url = `/dashb/search?title=${encodeURIComponent(keyword)}`;
  const response = await axiosInstance.get<ApiResponse<Game[]>>(url, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  return response.data;
};

// 게임 규칙 조회 API
export const getGameRule = async (gameId: string | number): Promise<ApiResponse<GameRule>> => {
  const response = await axiosInstance.get<ApiResponse<GameRule>>(`/dashb/detail/${gameId}`);
    console.log('[API 응답] 규칙 데이터:', response.data);

  return response.data;
};


// 게임 종료 API - 새로운 POST 엔드포인트 사용
export const endYachtGame = async (gameId: string): Promise<{success: boolean; message: string}> => {
  try {
    console.log(`[endYachtGame] 게임 종료 API 호출 시작, gameId: ${gameId}`);
    
    // 새로운 POST 엔드포인트 사용
    const response = await axios.post(`${SOCKET_SERVER_URL}/yacht/end/${gameId}`);
    
    console.log(`[endYachtGame] 게임 종료 API 응답:`, response.data);
    return response.data;
  } catch (error) {
    console.error('[endYachtGame] 게임 종료 API 호출 오류:', error);
    if (axios.isAxiosError(error)) {
      console.error('- 상태 코드:', error.response?.status);
      console.error('- 응답 데이터:', error.response?.data);
      console.error('- 요청 URL:', error.config?.url);
    }
    throw error;
  }
};

// 게임 삭제 API
export const deleteYachtGame = async (gameId: string): Promise<{success: boolean; message: string}> => {
  try {
    console.log(`[deleteYachtGame] 게임 삭제 API 호출 시작, gameId: ${gameId}`);
    
    // DELETE API 호출
    const response = await axios.delete(`${SOCKET_SERVER_URL}/yacht/${gameId}`);
    
    console.log(`[deleteYachtGame] 게임 삭제 API 응답:`, response.data);
    return response.data;
  } catch (error) { 
    console.error('[deleteYachtGame] 게임 삭제 API 호출 오류:', error);
    if (axios.isAxiosError(error)) {
      console.error('- 상태 코드:', error.response?.status);
      console.error('- 응답 데이터:', error.response?.data);
      console.error('- 요청 URL:', error.config?.url);
    }
    throw error;
  }
};

// 하이라이트 데이터 조회 API
export const getHighlightData = async (gameId: string, playerId: string): Promise<ApiResponse<HighlightData>> => {
  try {
    console.log(`[API 호출] 하이라이트 데이터 요청 - gameId: ${gameId}, playerId: ${playerId}`);
    
    // SOCKET_SERVER_URL 사용하여 API 호출
    const url = `${SOCKET_SERVER_URL}/highlight/${gameId}/${playerId}`;
    console.log(`[API URL] 하이라이트 데이터 요청 URL: ${url}`);
    
    const response = await axios.get<ApiResponse<HighlightData>>(url);
    
    console.log('[API 응답] 하이라이트 데이터:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API 오류] 하이라이트 데이터 조회 실패:', error);
    if (axios.isAxiosError(error)) {
      console.error('[API 오류 상세] 상태 코드:', error.response?.status);
      console.error('[API 오류 상세] 응답 데이터:', error.response?.data);
      console.error('[API 오류 상세] 요청 URL:', error.config?.url);
    }
    throw error;
  }
};