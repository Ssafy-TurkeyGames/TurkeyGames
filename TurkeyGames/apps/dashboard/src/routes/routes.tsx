// apps/dashboard/src/routes/routes.tsx
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '../components/Layout'; // 공통 레이아웃
import Home from '../pages/Home';  // 홈화면
import SearchGame from '../pages/SearchGame';  // 게임 검색 화면
import TurkeyDiceOptions from '../pages/games/TurkeyDice/GameOptions';  // 터키다이스 옵션 선택 화면
import ScoreBoard from '../pages/games/TurkeyDice/ScoreBoard';  // 터키다이스 점수 현황 페이지
import TurkeyDiceResult from '../components/games/GameResult';  // 터키다이스 게임 결과 페이지
import HighlightModal from '../pages/HighlightModal'; // 하이라이트 모달
import Rule from '../pages/Rule.tsx'
// ...다른 페이지 import

export default function AppRoutes() {
  const location = useLocation();
  // 모달을 띄우기 직전의 location을 backgroundLocation으로 저장
  const state = location.state as { backgroundLocation?: Location };

  return (
    <>
      <Routes location={state?.backgroundLocation || location}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<SearchGame />} />
          <Route path="/rule/:gameId" element={<Rule />} />
          {/* 게임 옵션 라우트 */}
          <Route path="game-options/:gameId" element={<TurkeyDiceOptions />} />
          {/* 터키다이스 게임 라우트 */}
          <Route path="games/TurkeyDice">
            <Route path="score" element={<ScoreBoard />} />
            <Route path="options" element={<TurkeyDiceOptions />} />
            <Route path="result" element={<TurkeyDiceResult />} />
            {/* 추가 터키다이스 관련 페이지들 */}
          </Route>
        </Route>
      </Routes>

      {/* 모달 라우트는 별도로 분리 */}
      {state?.backgroundLocation && (
        <Routes>
          <Route path="/games/TurkeyDice/highlight" element={<HighlightModal />} />
        </Routes>
      )}
    </>
  );
}