// components/games/TurkeyDice/ScoreCard.tsx
import React from 'react';
import styles from './ScoreCard.module.css';

// 등수 이미지 임포트
import rank1 from '../../../assets/images/ranks/1.png';
import rank2 from '../../../assets/images/ranks/2.png';
import rank3 from '../../../assets/images/ranks/3.png';
import rank4 from '../../../assets/images/ranks/4.png';

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
  items
}) => {
  // 플레이어 번호에 따라 등수 이미지 선택
  const getRankImage = (number: number) => {
    switch(number) {
      case 1: return rank1;
      case 2: return rank2;
      case 3: return rank3;
      case 4: return rank4;
      default: return rank1;
    }
  };

  return (
    <div className={styles.scoreCard}>
      <div className={styles.playerHeader}>
        <div className={styles.playerNumberContainer}>
          <img 
            src={getRankImage(playerNumber)} 
            alt={`${playerNumber}등`} 
            className={styles.rankImage}
          />
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
