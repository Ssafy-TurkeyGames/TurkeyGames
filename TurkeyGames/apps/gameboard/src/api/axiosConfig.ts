// app/api/axiosConfig.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 기본 API URL 설정
const BASE_URL = 'http://localhost:8000';

// 기본 axios 인스턴스 생성
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    // 요청 로깅 (개발용)
    if (process.env.NODE_ENV === 'development') {
      console.log('API 요청:', config.method?.toUpperCase(), config.url, config.data || config.params);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => {
    // 응답 로깅 (개발용)
    if (process.env.NODE_ENV === 'development') {
      console.log('API 응답:', response.status, response.config.url, response.data);
    }
    
    return response;
  },
  (error) => {
    // 에러 처리
    if (error.response) {
      // 서버 응답이 있는 에러
      console.error('API 에러:', error.response.status, error.response.data);
      
      // 401 Unauthorized 에러 처리 (인증 실패)
      if (error.response.status === 401) {
        // 로그아웃 처리 또는 토큰 갱신 로직
        // 예: store.dispatch(logout());
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답이 없는 에러
      console.error('서버 응답 없음:', error.request);
    } else {
      // 요청 설정 시 에러
      console.error('API 요청 에러:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// 타입 안전한 API 요청 래퍼 함수
export const apiRequest = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.get(url, config).then((response: AxiosResponse<T>) => response.data);
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.post(url, data, config).then((response: AxiosResponse<T>) => response.data);
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.put(url, data, config).then((response: AxiosResponse<T>) => response.data);
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.delete(url, config).then((response: AxiosResponse<T>) => response.data);
  },
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.patch(url, data, config).then((response: AxiosResponse<T>) => response.data);
  }
};

export default axiosInstance;