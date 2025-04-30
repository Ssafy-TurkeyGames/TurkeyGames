import React from 'react';
import { BrowserRouter, useLocation, Routes, Route } from 'react-router-dom';
import AppRoutes from './routes/routes';
import Rule from './pages/Rule';

function AppRoutesWrapper() {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location };

  return (
    <>
      {/* 백그라운드 화면 렌더링 */}
      {AppRoutes(state?.backgroundLocation || location)}
      
      {/* 모달 화면 렌더링 */}
      {state?.backgroundLocation && (
        <Routes>
          <Route path="/rule/:game_id" element={<Rule isModal={true} />} />
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutesWrapper />
    </BrowserRouter>
  );
}