// apps/dashboard/src/routes/routes.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout'; // 공통 레이아웃
import Home from '../pages/Home';  // 홈화면
import SearchGame from '../pages/SearchGame';  // 게임 검색 화면
// ...다른 페이지 import

export default function AppRoutes(location) {
    return (
      <Routes location={location}>
        <Route path="/" element={<Layout />}> // 공통 레이아웃
        <Route index element={<Home />} /> // /
        <Route path="search" element={<SearchGame />} /> // /search
        // 이 아래에 위에 path 줄처럼 다른 페이지 추가하시면 돼욥

        </Route>
    </Routes>
  );
}