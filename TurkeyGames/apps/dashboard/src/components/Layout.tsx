// apps/dashboard/src/components/Layout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import SearchBar from './SearchBar';

const Layout = () => {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 페이지 이동 시 검색어 초기화
    setSearch('');
  }, [location.pathname]);
  

  // 헤더를 숨길 경로 패턴 정의
  const hideHeaderPaths = [
    '/games/TurkeyDice/score',
    '/games/TurkeyDice/result'
  ];

  // 현재 경로가 hideHeaderPaths에 포함되어 있는지 확인
  const shouldHideHeader = hideHeaderPaths.some(path => 
    location.pathname.startsWith(path)
  );

  // 검색 실행 함수 - 검색 페이지로 이동
  const handleSearch = () => {
    if (search.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(search)}`);
    }
  };

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
              onSearch={handleSearch} // 검색 함수 추가
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