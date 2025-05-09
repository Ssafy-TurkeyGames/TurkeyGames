import React from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import AppRoutes from './routes/routes';
import Rule from './pages/Rule';

export default function App() {
  return <AppRoutesWrapper />; // 올바른 방식
}

function AppRoutesWrapper() {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location };

  return (
    <>
      {/* 백그라운드 화면 렌더링 - 컴포넌트로 수정 */}
      <AppRoutes />

      {/* 모달 화면 렌더링 */}
      {state?.backgroundLocation && (
        <Routes>
          <Route path="/rule/:gameId" element={<Rule isModal={true} />} />
        </Routes>
      )}
    </>
  );
}