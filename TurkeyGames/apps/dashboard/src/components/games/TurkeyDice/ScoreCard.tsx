import React from 'react';
import styles from './ScoreCard.module.css';

interface ScoreItem {
  name: string;
  completed: boolean;
}

interface ScoreCardProps {
  playerNumber: number;
  playerName: string;
  score: number;
  items: ScoreItem[];
}

const ScoreCard: React.FC<ScoreCardProps> = ({ playerNumber, playerName, score, items }) => {
  return (
    <div className={styles.scoreCard}>
      <div className={styles.playerHeader}>
        <div className={styles.playerNumber}>{playerNumber}</div>
        <div className={styles.playerName}>{playerName}</div>
      </div>
      <div className={styles.scoreValue}>SCORE {score}</div>
      <div className={styles.scoreTable}>
        {items.map((item, index) => (
          <div 
            key={index} 
            className={`${styles.scoreItem} ${item.completed ? styles.completed : ''}`}
          >
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreCard;
