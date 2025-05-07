// src/components/games/GameResult.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GameResult.module.css';

interface PlayerResult {
  id: number;
  name: string;
  score: number;
  rank?: number;
}

interface GameResultProps {
  players: PlayerResult[];
  gameId: string;
}

const GameResult: React.FC<GameResultProps> = (props) => {
  const navigate = useNavigate();
  
  // props 객체 자체를 콘솔에 출력
  console.log('GameResult props:', props);
  
  // props에서 직접 players와 gameId를 가져옴
  const { players = [], gameId = '' } = props;
  
  // players 배열 확인
  console.log('Players array:', players);
  
  // 점수 기준 내림차순 정렬
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  console.log('Sorted players:', sortedPlayers);
  
  // 순위 계산 (동점자는 같은 순위)
  let currentRank = 1;
  let prevScore = -1;
  const rankedPlayers = sortedPlayers.map((player, index) => {
    if (index > 0 && player.score < prevScore) {
      currentRank = index + 1;
    }
    prevScore = player.score;
    return { ...player, rank: currentRank };
  });
  
  console.log('Ranked players:', rankedPlayers);
  
  const handleHighlightClick = () => {
    navigate('/');
  };
  
  const handleRetryClick = () => {
    navigate(`/games/${gameId}/options`);
  };
  
  const handleBackClick = () => {
    navigate(-1);
  };
  
  // 하드코딩된 플레이어 데이터 (임시 해결책)
  const hardcodedPlayers = [
    { id: 1, name: '가현', score: 270, rank: 1 },
    { id: 2, name: '경록', score: 220, rank: 2 },
    { id: 3, name: '웅지', score: 202, rank: 3 },
    { id: 4, name: '동현', score: 200, rank: 4 }
  ];
  
  // 실제 데이터가 있으면 그것을 사용, 없으면 하드코딩된 데이터 사용
  const displayPlayers = rankedPlayers.length > 0 ? rankedPlayers : hardcodedPlayers;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo}>TURKEY GAMES</div>
        <h1 className={styles.title}>게임 결과</h1>
      </div>
      
      <div className={styles.resultTable}>
        <div className={styles.tableHeader}>
          <div className={styles.playerColumn}>PLAYER</div>
          <div className={styles.scoreColumn}>SCORE</div>
        </div>
        
        <div className={styles.tableBody}>
          {displayPlayers.map((player) => (
            <div key={player.id} className={styles.playerRow}>
              <div className={styles.playerInfo}>
                <div className={styles.playerRank}>{player.rank}</div>
                <div className={styles.playerName}>{player.name}</div>
              </div>
              <div className={styles.playerScore}>{player.score}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.buttonContainer}>
        <button className={styles.highlightButton} onClick={handleHighlightClick}>
          하이라이트
        </button>
        <button className={styles.retryButton} onClick={handleRetryClick}>
          다시하기
        </button>
        <button className={styles.backButton} onClick={handleBackClick}>
          뒤로가기
        </button>
      </div>
    </div>
  );
};

export default GameResult;
