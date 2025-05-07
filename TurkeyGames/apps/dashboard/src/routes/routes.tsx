// apps/dashboard/src/routes/routes.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout'; // 공통 레이아웃
import Home from '../pages/Home';  // 홈화면
import SearchGame from '../pages/SearchGame';  // 게임 검색 화면
import TurkeyDiceOptions from '../pages/games/TurkeyDice/GameOptions';  // 터키다이스 옵션 선택 화면
import ScoreBoard from '../pages/games/TurkeyDice/ScoreBoard';  // 터키다이스 점수 현황 페이지
import TurkeyDiceResult from '../components/games/GameResult';  // 터키다이스 게임 결과 페이지
// ...다른 페이지 import

export default function AppRoutes(location) {
    return (
      <Routes location={location}>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<SearchGame />} />
        {/* 게임 옵션 라우트 */}
        <Route path="game-options/:game_id" element={<TurkeyDiceOptions />} />
        {/* 터키다이스 게임 라우트 */}
        <Route path="games/TurkeyDice">
            <Route path="score" element={<ScoreBoard />} />
            <Route path="options" element={<TurkeyDiceOptions />} />
            <Route path="result" element={<TurkeyDiceResult />} />
            {/* 추가 터키다이스 관련 페이지들 */}
          </Route>
        {/* 다른 페이지 추가는 아래처럼 */}
        {/* <Route path="something" element={<Something />} /> */}
      </Route>
    </Routes>
  );
}