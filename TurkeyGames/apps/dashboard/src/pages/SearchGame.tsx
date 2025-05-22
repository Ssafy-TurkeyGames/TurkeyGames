// apps/dashboard/src/pages/SearchGame.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './SearchGame.module.css';
import logo from '../assets/images/logo.png';
import { getAllGames, getFilteredGames, searchGamesByKeyword, clearGameCache } from '../api/dashboardApi';
import { Game } from '../api/types';
import searchIcon from '../assets/images/search (1).png';

// 게임 ID별 기본 이미지 임포트
import gameImage1 from '../assets/images/gameimages/1.png';
import gameImage2 from '../assets/images/gameimages/2.png';
import gameImage3 from '../assets/images/gameimages/3.png';
import gameImage4 from '../assets/images/gameimages/4.png';
import gameImage5 from '../assets/images/gameimages/5.png';

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
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  
  // URL 유효성 검사 함수
  const isValidUrl = (url: string): boolean => {
    try {
      return url && (url.startsWith('http://') || url.startsWith('https://'));
    } catch (e) {
      return false;
    }
  };

  // gameId에 따른 기본 이미지 선택
  const getDefaultGameImage = (gameId: number): string => {
    switch (gameId) {
      case 1:
        return gameImage1;
      case 2:
        return gameImage2;
      case 3:
        return gameImage3;
      case 4:
        return gameImage4;
      case 5:
        return gameImage5;
      default:
        return logo; // 기본 로고 이미지
    }
  };

  // 필터가 적용되었는지 확인
  const isFilterActive = selectedPlayers.length > 0 || selectedLevels.length > 0;

  // 1. 필터/URL 파라미터 변경 시 검색 (유지)
  useEffect(() => {
    // 첫 렌더링 시에만 실행되도록 제어
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const effectiveSearch = keywordParam !== null ? keywordParam : search;
      fetchGames(effectiveSearch);
    } else {
      // 첫 렌더링이 아닌 경우에만 실행
      const effectiveSearch = keywordParam !== null ? keywordParam : search;
      fetchGames(effectiveSearch);
    }
  }, [selectedPlayers, selectedLevels, keywordParam]);

  // 2. 실시간 검색 핸들링 (유지)
  useEffect(() => {
    if (selectedPlayers.length > 0 || selectedLevels.length > 0) return;
    if (keywordParam !== null) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchGames(search);
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);
  
  // 모든 필터 초기화
  const clearAllFilters = async () => {
    setSelectedPlayers([]);
    setSelectedLevels([]);
    setSearch('');
    
    // 캐시 초기화 및 강제 새로고침으로 전체 게임 목록 불러오기
    setLoading(true);
    try {
      // 캐시 초기화
      clearGameCache();
      
      // 강제 새로고침으로 전체 게임 목록 불러오기
      const response = await getAllGames(true);
      
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
      {/* 고정 검색창 */}
      <div className={styles.fixedSearchBar}>
        <div className={styles.searchBarInner}>
          <input
            className={styles.input}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="게임을 검색해보세요"
            onKeyDown={(e) => e.key === 'Enter' && fetchGames(search)}
          />
          <button 
            className={styles.iconBtn} 
            onClick={() => fetchGames(search)}
            aria-label="검색"
          >
            <img 
              src={searchIcon}
              alt="검색" 
              className={styles.icon} 
            />
          </button>
        </div>
      </div>

      {/* 필터, 결과 등 렌더링 */}
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
      {error && !loading && (
        <div className={styles.errorContainer}>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && (
        <div className={styles.cardList}>
          {games.length > 0 ? (
            games.map(game => (
              <div key={game.gameId} className={styles.gameCard}>
                <img
                  src={isValidUrl(game.gameProfilePath) ? game.gameProfilePath : getDefaultGameImage(game.gameId)}
                  alt={game.title}
                  className={styles.gameImg}
                  onError={(e) => {
                    e.currentTarget.src = getDefaultGameImage(game.gameId);
                    e.currentTarget.onerror = null;
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
