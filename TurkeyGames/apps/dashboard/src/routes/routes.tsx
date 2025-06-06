import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '../components/Layout'; // 공통 레이아웃
import Home from '../pages/Home';  // 홈화면
import SearchGame from '../pages/SearchGame';  // 게임 검색 화면
import TurkeyDiceOptions from '../pages/games/TurkeyDice/GameOptions';  // 터키다이스 옵션 선택 화면
import ScoreBoard from '../pages/games/TurkeyDice/ScoreBoard';  // 터키다이스 점수 현황 페이지
import TurkeyDiceResult from '../pages/games/TurkeyDice/GameResult';  // 터키다이스 게임 결과 페이지
import HighlightModal from '../pages/HighlightModal'; // 하이라이트 모달
import Rule from '../pages/Rule.tsx'
// ...다른 페이지 import

export default function AppRoutes() {
  const location = useLocation();
  // 모달을 띄우기 직전의 location을 backgroundLocation으로 저장
  const state = location.state as { backgroundLocation?: Location };
  const backgroundLocation = state?.backgroundLocation;

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<SearchGame />} />
          <Route path="rule/:gameId" element={<Rule />} />
          {/* 게임 옵션 라우트 - gameId 파라미터 추가 */}
          <Route path="game-options/:gameId" element={<TurkeyDiceOptions />} />
          <Route path="game-options" element={<TurkeyDiceOptions />} />
          {/* 터키다이스 게임 라우트 */}
          <Route path="games/TurkeyDice">
            <Route path="score" element={<ScoreBoard />} />
            <Route path="options" element={<TurkeyDiceOptions />} />
            <Route path="result/:gameId" element={<TurkeyDiceResult />} />
            {/* 추가 터키다이스 관련 페이지들 */}
          </Route>
          {/* 새로운 하이라이트 경로 - URL 파라미터 방식 */}
          <Route path="highlight/:gameId/:playerId" element={<HighlightModal />} />
        </Route>
      </Routes>

      {/* 모달 라우트는 별도로 분리 */}
      {state?.backgroundLocation && (
        <Routes>
          <Route path="/highlight/:gameId/:playerId" element={<HighlightModal />} />
          {/* 새 API 방식 하이라이트 경로도 추가 */}
          <Route path="/highlight/:gameId/:playerId" element={<HighlightModal />} />
          {/* 규칙 모달 경로 추가 */}
          <Route path="/rule/:gameId" element={<Rule isModal={true} />} />
        </Routes>
      )}
    </>
  );
}