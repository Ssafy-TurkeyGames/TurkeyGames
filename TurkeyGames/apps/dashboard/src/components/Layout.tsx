import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 헤더 숨길 경로
  const hideHeaderPaths = [
    '/games/TurkeyDice/score',
    '/games/TurkeyDice/result'
  ];
  const shouldHideHeader = hideHeaderPaths.some(path => 
    location.pathname.startsWith(path)
  );

  return (
    <>
      {!shouldHideHeader && <Header />}
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default Layout;
