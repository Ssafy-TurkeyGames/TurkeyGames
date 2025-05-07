// apps/dashboard/src/components/Layout.tsx
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import SearchBar from './SearchBar';

const Layout = () => {
  const location = useLocation();
  const [search, setSearch] = useState('');

  // 헤더를 숨길 경로 패턴 정의
  const hideHeaderPaths = [
    '/games/TurkeyDice/score',
    '/games/TurkeyDice/result'
  ];

  // 현재 경로가 hideHeaderPaths에 포함되어 있는지 확인
  const shouldHideHeader = hideHeaderPaths.some(path => 
    location.pathname.startsWith(path)
  );

  // 홈이 아니면 검색창을 보여줌
  const showSearchBar = location.pathname !== '/';

  return (
    <>
      {!shouldHideHeader && (
        <Header>
          {showSearchBar && (
            <SearchBar
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="게임을 검색해보세요"
            />
          )}
        </Header>
      )}
      <main>
        <Outlet context={{ search, setSearch }} />
      </main>
    </>
  );
};

export default Layout;