// src/components/games/GameResult.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './GameResult.module.css';
import logo from '../../assets/images/logo.png';

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

  const handleHighlightClick = () => {
    navigate('/games/TurkeyDice/highlight', {
      state: {
        backgroundLocation: location, // 현재 위치를 백그라운드로 설정
        qrValue: 'https://example.com/turkey-dice-highlight',
        title: 'QR코드를 인식하면 최고의 플레이 영상을 보실 수 있어요!'
      }
    });
  };

  const handleRetryClick = () => navigate(`/games/${gameId}/options`);
  const handleBackClick = () => navigate(-1);

  return (
    <div className={styles.container}>
      <div className={styles.fireworks}></div>
      
      <img 
        src={logo}
        alt="Turkey Games Logo" 
        className={styles.logo}
        onClick={() => navigate('/')}
      />
      
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
      
      <h1 className={styles.title}>게임 결과</h1>
      
      <div className={styles.resultArea}>
        <div className={styles.rankNumbers}>
          {rankedPlayers.map((player) => (
            <div key={`rank-${player.id}`} className={styles.bigRankNumber}>
              {player.rank}
            </div>
          ))}
        </div>
        
        <div className={styles.resultTable}>
          <div className={styles.tableHeader}>
            <div className={styles.playerColumn}>PLAYER</div>
            <div className={styles.scoreColumn}>SCORE</div>
          </div>
          
          <div className={styles.tableBody}>
            {rankedPlayers.map((player) => (
              <div 
                key={player.id} 
                className={styles.playerRow}
              >
                <div className={styles.playerName}>{player.name}</div>
                <div className={styles.playerScore}>{player.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameResult;
