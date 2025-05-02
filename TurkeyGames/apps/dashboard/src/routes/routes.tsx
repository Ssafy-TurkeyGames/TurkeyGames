// apps/dashboard/src/routes/routes.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout'; // 공통 레이아웃
import Home from '../pages/Home';  // 홈화면
import SearchGame from '../pages/SearchGame';  // 게임 검색 화면
import TurkeyDiceOptions from '../pages/games/TurkeyDice/GameOptions';  // 터키다이스 옵션 선택 화면
// ...다른 페이지 import

export default function AppRoutes(location) {
    return (
      <Routes location={location}>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<SearchGame />} />
        {/* 게임 옵션 라우트 */}
        <Route path="game-options">
          <Route path=":game_id" element={<TurkeyDiceOptions />} />
        </Route>
        {/* 다른 페이지 추가는 아래처럼 */}
        {/* <Route path="something" element={<Something />} /> */}
      </Route>
    </Routes>
  );
}