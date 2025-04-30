// apps/dashboard/src/components/Layout.tsx
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import SearchBar from './SearchBar';

const Layout = () => {
  const location = useLocation();
  const [search, setSearch] = useState('');

  // 홈이 아니면 검색창을 보여줌
  const showSearchBar = location.pathname !== '/';

  return (
    <>
      <Header>
        {showSearchBar && (
          <SearchBar
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="게임을 검색해보세요"
          />
        )}
      </Header>
      <main>
        <Outlet context={{ search, setSearch }} />
      </main>
    </>
  );
};

export default Layout;