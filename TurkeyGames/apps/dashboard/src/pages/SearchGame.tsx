// apps/dashboard/src/pages/SearchGame.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './SearchGame.module.css';
import searchIcon from '../assets/images/search.png';
import logo from '../assets/images/logo.png';
import { getAllGames, getFilteredGames, searchGamesByKeyword } from '../api/dashboardApi';
import { Game } from '../api/types';

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
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 게임 목록 불러오기
  const fetchGames = async () => {
    try {
      setLoading(true);
      
      let response;
      
      // 필터가 선택된 경우
      if (selectedPlayer || selectedLevel) {
        // 인원수 필터 변환
        let peopleFilter: number[] | undefined;
        if (selectedPlayer) {
          const playerNumber = parseInt(selectedPlayer.replace('인', ''));
          peopleFilter = [playerNumber];
        }
        
        // 난이도 필터 변환
        let levelFilter: number[] | undefined;
        if (selectedLevel) {
          const levelIndex = levelFilters.indexOf(selectedLevel) + 1;
          levelFilter = [levelIndex];
        }
        
        // 필터링된 게임 목록 가져오기
        response = await getFilteredGames(peopleFilter, levelFilter);
      } 
      // 검색어가 있는 경우
      else if (search.trim()) {
        // 키워드로 게임 검색
        response = await searchGamesByKeyword(search);
      } 
      // 필터와 검색어가 모두 없는 경우
      else {
        // 모든 게임 목록 가져오기
        response = await getAllGames();
      }
      
      if (response.code === 'SUCCESS') {
        setGames(response.data || []);
        setError(null);
      } else {
        setError(response.message || '게임 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('게임 목록 조회 오류:', err);
      setError('게임 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로딩 및 필터 변경 시 게임 목록 불러오기
  useEffect(() => {
    fetchGames();
  }, [selectedPlayer, selectedLevel]);

  // 검색어 변경 시 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGames();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // 인원수 표시 형식 변환 (예: [2, 3, 4] -> "2 ~ 4인")
  const formatPlayerCount = (people: number[]) => {
    if (!people || people.length === 0) return "정보 없음";
    const min = Math.min(...people);
    const max = Math.max(...people);
    return min === max ? `${min}인` : `${min} ~ ${max}인`;
  };

  // 플레이어 필터 토글
  const togglePlayerFilter = (filter: string) => {
    setSelectedPlayer(selectedPlayer === filter ? null : filter);
  };

  // 레벨 필터 토글
  const toggleLevelFilter = (filter: string) => {
    setSelectedLevel(selectedLevel === filter ? null : filter);
  };

  return (
    <div className={styles.container}>
      {/* 검색 입력창 */}
      <div className={styles.searchBox}>
        <img src={searchIcon} alt="검색" className={styles.searchIcon} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="게임을 검색해보세요"
          className={styles.searchInput}
        />
      </div>

      {/* 필터 버튼 */}
      <div className={styles.filterRow}>
        {playerFilters.map(label => (
          <button
            key={label}
            className={`${styles.filterBtn} ${selectedPlayer === label ? styles.active : ''}`}
            onClick={() => togglePlayerFilter(label)}
          >
            {label}
          </button>
        ))}
        <span className={styles.divider}>|</span>
        {levelFilters.map((label) => (
          <button
            key={label}
            className={`${styles.filterBtn} ${selectedLevel === label ? styles.active : ''}`}
            onClick={() => toggleLevelFilter(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className={styles.loadingContainer}>
          <p>게임 목록을 불러오는 중...</p>
        </div>
      )}

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
              <div key={game.game_id} className={styles.gameCard}>
                <img 
                  src={game.gameProfilePath || logo} 
                  alt={game.title} 
                  className={styles.gameImg}
                  onError={(e) => {
                    // 이미지 로드 실패 시 기본 이미지로 대체
                    e.currentTarget.src = logo;
                  }}
                />
                <div className={styles.gameInfo}>
                  <div className={styles.gameTitle}>{game.title}</div>
                  <div className={styles.gameMeta}>
                    <span className={styles.metaIcon}>👥</span>
                    <span className={styles.metaText}>{formatPlayerCount(game.people)}</span>
                    <span className={styles.level}>{levelMapping[game.level as keyof typeof levelMapping] || '정보 없음'}</span>
                  </div>
                  <div className={styles.gameDesc}>{game.description}</div>
                </div>
                <div className={styles.cardBtns}>
                  <button
                    className={styles.ruleBtn}
                    onClick={() =>
                      navigate(`/rule/${game.game_id}`, { state: { backgroundLocation: location } })
                    }>
                    📖 규칙
                  </button>
                  <button 
                    className={styles.playBtn}
                    onClick={() => navigate(`/game-options/${game.game_id}`)}>
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
