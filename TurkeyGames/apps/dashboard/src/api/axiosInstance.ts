// apps/dashboard/src/api/axiosInstance.ts

import axios from 'axios';

// 환경에 따른 기본 URL 설정
const baseURL = 'https://k12e101.p.ssafy.io/api';

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
    );

// 응답 인터셉터
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API 호출 오류:', error);
        return Promise.reject(error);
    }
    );

export default axiosInstance;
