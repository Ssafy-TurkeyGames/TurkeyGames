// src/components/games/GameResult.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './GameResult.module.css';
import Logo from '../common/Logo';
// 등수 이미지 import
import rank1 from '../../assets/images/ranks/1.png';
import rank2 from '../../assets/images/ranks/2.png';
import rank3 from '../../assets/images/ranks/3.png';
import rank4 from '../../assets/images/ranks/4.png';
import rankEffect from '../../assets/images/ranks/rank_effect.png';

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

const GameResult: React.FC<GameResultProps> = ({ players, gameId }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 방어 코드 추가
  const arrPlayers = Array.isArray(players) ? players : [];
  const sortedPlayers = [...arrPlayers].sort((a, b) => b.score - a.score);
  
  let currentRank = 1;
  let prevScore = -1;
  const rankedPlayers = sortedPlayers.map((player, index) => {
    if (index > 0 && player.score < prevScore) {
      currentRank = index + 1;
    }
    prevScore = player.score;
    return { ...player, rank: currentRank };
  });

  // 등수별 이미지 매핑
  const getRankImage = (rank: number) => {
    switch(rank) {
      case 1: return rank1;
      case 2: return rank2;
      case 3: return rank3;
      case 4: return rank4;
      default: return rank4;
    }
  };

  const handleHighlightClick = () => {
    navigate('/games/TurkeyDice/highlight', {
      state: {
        backgroundLocation: location, // 현재 위치를 백그라운드로 설정
        qrValue: 'https://example.com/turkey-dice-highlight',
        title: 'QR코드를 인식하면 최고의 플레이 영상을 보실 수 있어요!'
      }
    });
  };

  const handleRetryClick = () => {
  // gameId가 'TurkeyDice'인 경우 TurkeyDice 옵션 페이지로 이동
  // if (gameId === '1') {
  //   navigate('/games/TurkeyDice/options');
  // } else {
  //   // 다른 게임인 경우 -- 경로로 이동
    navigate(`/game-options/`);
};


  const handleBackClick = () => navigate('/');

  return (
    <div className={styles.container}>
    <div className={styles.logoContainer}>
      <Logo size="medium" />
    </div>
    
    <h1 className={styles.title}>게임 결과</h1>
    
    <div className={styles.resultContainer}>
      <div className={styles.resultHeader}>
        <div className={styles.rankHeader}>RANK</div>
        <div className={styles.playerHeader}>PLAYER</div>
        <div className={styles.scoreHeader}>SCORE</div>
      </div>
      
      <div className={styles.resultRows}>
        {rankedPlayers.map((player) => (
          <div 
            key={player.id} 
            className={`${styles.resultRow} ${player.rank === 1 ? styles.firstPlace : ''}`}
          >
            <div className={styles.rankCell}>
              <img 
                src={getRankImage(player.rank || 1)} 
                alt={`${player.rank}등`} 
                className={styles.rankImage}
              />
              {player.rank === 1 && (
                <img 
                  src={rankEffect} 
                  alt="1등 효과" 
                  className={styles.rankEffect}
                />
              )}
            </div>
            <div className={styles.playerName}>{player.name}</div>
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
        그만하기
      </button>
    </div>
  </div>
);
};

export default GameResult;