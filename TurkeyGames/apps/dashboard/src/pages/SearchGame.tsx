// apps/dashboard/src/pages/SearchGame.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './SearchGame.module.css';
import logo from '../assets/images/logo.png';
import { getAllGames, getFilteredGames, searchGamesByKeyword } from '../api/dashboardApi';
import { Game } from '../api/types';
import SearchBar from '../components/SearchBar';

// 필터 버튼 데이터
const playerFilters = ['2인', '3인', '4인'];
const levelFilters = ['입문', '초보', '중수', '고수'];

// 레벨 매핑 (API 응답의 숫자 레벨을 텍스트로 변환)
const levelMapping = {
  1: '입문',
  2: '초보',
  3: '중수',
  4: '고수'
};

export default function SearchGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // URL 파라미터에서 검색어 읽기 추가
  const searchParams = new URLSearchParams(location.search);
  const keywordParam = searchParams.get('keyword');

  // 필터가 적용되었는지 확인
  const isFilterActive = selectedPlayers.length > 0 || selectedLevels.length > 0;

  // 검색 버튼/엔터 클릭 핸들러
  const handleSearch = () => {
    fetchGames();
    // URL 업데이트 (선택사항)
    if (search.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(search)}`, { replace: true });
    }
  };

  // 컴포넌트 마운트 시 URL 파라미터 검색어 적용
  useEffect(() => {
    // keywordParam이 있으면 우선 적용
    const effectiveSearch = keywordParam !== null ? keywordParam : search;
    fetchGames(effectiveSearch);
  }, [selectedPlayers, selectedLevels, search, keywordParam]);
  
  // 모든 필터 초기화
  const clearAllFilters = () => {
    setSelectedPlayers([]);
    setSelectedLevels([]);
    setSearch('');
    fetchGames('');
  };

  // 게임 목록 불러오기
  const fetchGames = async (searchTerm = search) => {
    setLoading(true);
    try {
      let response;
      
      // 필터가 선택된 경우
      if (selectedPlayers.length > 0 || selectedLevels.length > 0) {
        // 인원수 필터 변환
        const peopleFilter = selectedPlayers.length > 0 
          ? selectedPlayers.map(p => parseInt(p.replace('인', '')))
          : undefined;
        
        // 난이도 필터 변환
        const levelFilter = selectedLevels.length > 0
          ? selectedLevels.map(l => levelFilters.indexOf(l) + 1)
          : undefined;
        
        response = await getFilteredGames(peopleFilter, levelFilter);
      } 
      // 검색어가 있는 경우
      else if (searchTerm.trim()) {
        response = await searchGamesByKeyword(searchTerm);
      } 
      // 필터와 검색어가 모두 없는 경우
      else {
        response = await getAllGames();
      }

      // 응답 처리
      if (response.code === 'SUCCESS') {
        setGames(response.data || []);
        setError(null);
      } else {
        console.error('❌ API 오류:', response.message);
        setError(response.message || '게임 목록을 불러오는데 실패했습니다.');
        setGames([]);
      }
    } catch (err) {
      console.error('❌ 네트워크 오류:', err);
      setError('서버 연결에 실패했습니다.');
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 이동 감지 및 검색어 초기화
  useEffect(() => {
    // 컴포넌트 마운트 시 검색어 초기화
    setSearch('');
    
    // 페이지 이탈 시 정리 함수
    return () => {
      setSearch('');
    };
  }, [location.pathname]); // 경로 변경 시 실행

  // 인원수 표시 형식 변환
  const formatPlayerCount = (people: number[]) => {
    if (!people || people.length === 0) return "정보 없음";
    const min = Math.min(...people);
    const max = Math.max(...people);
    return min === max ? `${min}인` : `${min} ~ ${max}인`;
  };

  // 플레이어 필터 토글
  const togglePlayerFilter = (filter: string) => {
    setSelectedPlayers(prev => 
      prev.includes(filter) 
        ? prev.filter(p => p !== filter) 
        : [...prev, filter]
    );
    setSearch(''); // 검색어 초기화
  };

  // 레벨 필터 토글
  const toggleLevelFilter = (filter: string) => {
    setSelectedLevels(prev => 
      prev.includes(filter) 
        ? prev.filter(l => l !== filter) 
        : [...prev, filter]
    );
    setSearch(''); // 검색어 초기화
  };

  return (
    <div className={styles.container}>
      {/* SearchBar 컴포넌트 사용 - onSearch prop 전달 필수 */}
      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onSearch={handleSearch}
        placeholder="게임을 검색해보세요"
      />

      {/* 필터 버튼 */}
      <div className={styles.filterRow}>
        {playerFilters.map(label => (
          <button
            key={label}
            className={`${styles.filterBtn} ${selectedPlayers.includes(label) ? styles.active : ''}`}
            onClick={() => togglePlayerFilter(label)}
          >
            {label}
          </button>
        ))}
        <span className={styles.divider}>|</span>
        {levelFilters.map(label => (
          <button
            key={label}
            className={`${styles.filterBtn} ${selectedLevels.includes(label) ? styles.active : ''}`}
            onClick={() => toggleLevelFilter(label)}
          >
            {label}
          </button>
        ))}
        
        {/* 필터 초기화 버튼 */}
        {isFilterActive && (
          <>
            <span className={styles.divider}>|</span>
            <button
              className={styles.clearFilterBtn}
              onClick={clearAllFilters}
              title="모든 필터 초기화"
            >
              필터 초기화
            </button>
          </>
        )}
      </div>

      {/* 에러 상태 */}
      {error && !loading && (
        <div className={styles.errorContainer}>
          <p>{error}</p>
        </div>
      )}

      {/* 게임 카드 리스트 */}
      {!loading && !error && (
        <div className={styles.cardList}>
          {games.length > 0 ? (
            games.map(game => (
              <div key={game.gameId} className={styles.gameCard}>
                <img
                  src={game.gameProfilePath || logo}
                  alt={game.title}
                  className={styles.gameImg}
                  onError={(e) => {
                    e.currentTarget.src = logo;
                  }}
                />
                <div className={styles.gameInfo}>
                  <div className={styles.gameTitle}>{game.title}</div>
                  <div className={styles.gameMeta}>
                    <span className={styles.metaIcon}>👥</span>
                    <span className={styles.metaText}>{formatPlayerCount(game.people)}</span>
                    <span className={styles.level}>
                      {levelMapping[game.level as keyof typeof levelMapping] || '정보 없음'}
                    </span>
                  </div>
                  <div className={styles.gameDesc}>{game.description}</div>
                </div>
                <div className={styles.cardBtns}>
                  <button
                    className={styles.ruleBtn}
                    onClick={() => navigate(`/rule/${game.gameId}`, {
                      state: { backgroundLocation: location }
                    })}
                  >
                    📖 규칙
                  </button>
                  <button
                    className={styles.playBtn}
                    onClick={() => navigate(`/game-options/${game.gameId}`)}
                  >
                    ⚡ 게임 하기
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              <p>검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
