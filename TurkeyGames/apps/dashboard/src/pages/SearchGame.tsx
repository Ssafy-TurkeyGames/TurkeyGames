// apps/dashboard/src/pages/SearchGame.tsx

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './SearchGame.module.css';
import searchIcon from '../assets/images/search.png'; // 검색 아이콘
import turkeyDice from '../assets/images/T_dice.png'; // 칠면조 다이스 이미지
import turkeyClock from '../assets/images/T_5.png'; // 5초 준닭 이미지
import logo from '../assets/images/logo.png';  // 로고 이미지


// 필터 버튼 데이터 
const playerFilters = ['2인', '3인', '4인'];
const levelFilters = ['입문', '초보', '중수', '고수'];

// 샘플 더미
const games = [
  {
    id: 1,
    image: turkeyDice,
    title: '칠면조 다이스',
    players: '2 ~ 4인',
    level: '입문',
    description: '주사위 5개로 족보 만들기 :)',
  },
  {
    id: 2,
    image: turkeyClock,
    title: '5초 준닭! 꼬꼬닭!',
    players: '2 ~ 4인',
    level: '입문',
    description: '5초 안에 제시어에 해당하는 단어 말하기!',
  },
];

export default function SearchGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  return (
    <div className={styles.container}>
      {/* 필터 버튼 */}
      <div className={styles.filterRow}>
        {playerFilters.map(label => (
          <button
            key={label}
            className={`${styles.filterBtn} ${selectedPlayer === label ? styles.active : ''}`}
            onClick={() => setSelectedPlayer(label)}
          >
            {label}
          </button>
        ))}
        <span className={styles.divider}>|</span>
        {levelFilters.map(label => (
          <button
            key={label}
            className={`${styles.filterBtn} ${selectedLevel === label ? styles.active : ''}`}
            onClick={() => setSelectedLevel(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 게임 카드 리스트 */}
      <div className={styles.cardList}>
        {games.map(game => (
          <div key={game.id} className={styles.gameCard}>
            <img src={game.image} alt={game.title} className={styles.gameImg} />
            <div className={styles.gameInfo}>
              <div className={styles.gameTitle}>{game.title}</div>
              <div className={styles.gameMeta}>
                <span className={styles.metaIcon}>👥</span>
                <span className={styles.metaText}>{game.players}</span>
                <span className={styles.level}>{game.level}</span>
              </div>
              <div className={styles.gameDesc}>{game.description}</div>
            </div>
            <div className={styles.cardBtns}>
                <button
                    className={styles.ruleBtn}
                    onClick={() =>
                        navigate(`/rule/${game.id}`, { state: { backgroundLocation: location } })
                    }>
                    📖 규칙
                </button>
                <button className={styles.playBtn}>⚡ 게임 하기</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
