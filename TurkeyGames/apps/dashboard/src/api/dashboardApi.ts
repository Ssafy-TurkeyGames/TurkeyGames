// apps/dashboard/src/api/dashboardApi.ts
import axios from 'axios';
import axiosInstance from './axiosInstance';
import { ApiResponse, Game } from './types';

// 모든 게임 목록 조회
export const getAllGames = async (): Promise<ApiResponse<Game[]>> => {
    // console.log('API 요청 URL:', `${axiosInstance.defaults.baseURL}/dashb`);
    try {
      const response = await axiosInstance.get<ApiResponse<Game[]>>('/dashb');
      // console.log('API 응답:', response);
      return response.data;
    } catch (error) {
      // console.error('getAllGames 에러 세부 정보:', error);
      if (error.response) {
        // console.error('서버 응답:', error.response.data);
        // console.error('서버 상태 코드:', error.response.status);
      }
      throw error;
    }
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
    const response = await axiosInstance.get<ApiResponse<Game[]>>(url);
    return response.data;
  };

// 키워드로 게임 검색
export const searchGamesByKeyword = async (keyword: string): Promise<ApiResponse<Game[]>> => {
 // console.log('API 검색 요청:', keyword);
  if (!keyword.trim()) {
    return getAllGames();
  }
    
  const url = `/dashb/search?title=${encodeURIComponent(keyword)}`;
 // console.log('요청 URL:', url);
  const response = await axiosInstance.get<ApiResponse<Game[]>>(url);
 // console.log('검색 응답:', response.data);
  return response.data;
};

  // 게임 규칙 조회 API
export const getGameRule = async (gameId: string | number): Promise<ApiResponse<GameRule>> => {
    const response = await axiosInstance.get<ApiResponse<GameRule>>(`/dashb/detail/${gameId}`);
    return response.data;
  };

  // 게임 종료 API
  export const endYachtGame = async (gameId: string | number): Promise<any> => {
    try {
      console.log('게임 종료 API 호출 시작');
      console.log('axiosInstance baseURL:', axiosInstance.defaults.baseURL);
      console.log('요청 URL:', `${axiosInstance.defaults.baseURL}/yacht/${gameId}`);
      const SOCKET_SERVER_URL = 'http://192.168.30.158:8000';
      const response = await axios.delete(`${SOCKET_SERVER_URL}/yacht/${gameId}`);
      console.log('게임 종료 API 응답:', response.data);
    return response.data;
    } catch (error) {
      console.error('게임 종료 오류:', error);
      if (axios.isAxiosError(error)) {
        console.error('에러 상태 코드:', error.response?.status);
        console.error('에러 데이터:', error.response?.data);
        console.error('에러 URL:', error.config?.url);
      }
      throw error;
    }
  };