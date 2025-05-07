// components/games/TurkeyDice/ScoreCard.tsx
import React from 'react';
import styles from './ScoreCard.module.css';

interface ScoreItem {
  name: string;
  score: number;
  completed: boolean;
}

interface ScoreCardProps {
  playerNumber: number;
  playerName: string;
  score: number;
  items: ScoreItem[];
  isFirst?: boolean;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ 
  playerNumber, 
  playerName, 
  score, 
  items,
  isFirst = false 
}) => {
  return (
    <div className={`${styles.scoreCard} ${isFirst ? styles.firstPlace : ''}`}>
      <div className={styles.playerHeader}>
        <div className={`${styles.playerNumber} ${isFirst ? styles.firstPlaceNumber : ''}`}>
          {playerNumber}
        </div>
        <div className={styles.playerName}>{playerName}</div>
      </div>
      <div className={styles.scoreValue}>SCORE {score}</div>
      <div className={styles.scoreTable}>
        <table>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={item.completed ? styles.completed : ''}>
                <td className={styles.itemName}>{item.name}</td>
                <td className={styles.itemScore}>{item.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScoreCard;