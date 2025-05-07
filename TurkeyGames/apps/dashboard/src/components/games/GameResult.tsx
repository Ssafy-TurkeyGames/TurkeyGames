// src/components/games/GameResult.tsx
import React from 'react';
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

const GameResult: React.FC<GameResultProps> = ({ players, gameId }) => {
  const navigate = useNavigate();

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
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
        qrValue: 'https://example.com/turkey-dice-highlight',
        title: 'QR코드를 인식하면 최고의 플레이 영상을 보실 수 있어요!'
      }
    });
  };

  const handleRetryClick = () => navigate(`/games/${gameId}/options`);
  const handleBackClick = () => navigate(-1);

  return (
    <div className={styles.container}>
      <img 
        src="/logo.png" 
        alt="Turkey Games Logo" 
        className={styles.logo}
        onClick={() => navigate('/')}
      />
      
      <h1 className={styles.title}>게임 결과</h1>
      
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
              style={{ animation: 'fadeIn 0.5s ease forwards' }}
            >
              <div className={styles.playerInfo}>
                <div className={styles.playerRank}>{player.rank}</div>
                <div className={styles.playerName}>{player.name}</div>
              </div>
              <div className={styles.playerScore}>
                {player.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.buttonContainer}>
        <button className={styles.highlightButton} onClick={handleHighlightClick}>
          🎥 하이라이트
        </button>
        <button className={styles.retryButton} onClick={handleRetryClick}>
          🔄 다시하기
        </button>
        <button className={styles.backButton} onClick={handleBackClick}>
          ← 뒤로가기
        </button>
      </div>
    </div>
  );
};

export default GameResult;
