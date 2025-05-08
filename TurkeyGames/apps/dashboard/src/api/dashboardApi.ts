// apps/dashboard/src/api/dashboardApi.ts

import axiosInstance from './axiosInstance';
import { ApiResponse, Game } from './types';

// 모든 게임 목록 조회
export const getAllGames = async (): Promise<ApiResponse<Game[]>> => {
    console.log('API 요청 URL:', `${axiosInstance.defaults.baseURL}/dashb`);
    try {
      const response = await axiosInstance.get<ApiResponse<Game[]>>('/dashb');
      console.log('API 응답:', response);
      return response.data;
    } catch (error) {
      console.error('getAllGames 에러 세부 정보:', error);
      if (error.response) {
        console.error('서버 응답:', error.response.data);
        console.error('서버 상태 코드:', error.response.status);
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
    if (!keyword.trim()) {
      return getAllGames();
    }
    
    const response = await axiosInstance.get<ApiResponse<Game[]>>(`/dashb/search?title=${encodeURIComponent(keyword)}`);
    return response.data;
  };

  // 게임 규칙 조회 API 추가
export const getGameRule = async (game_id: string | number): Promise<ApiResponse<GameRule>> => {
    const response = await axiosInstance.get<ApiResponse<GameRule>>(`/dashb/detail/${game_id}`);
    return response.data;
  };