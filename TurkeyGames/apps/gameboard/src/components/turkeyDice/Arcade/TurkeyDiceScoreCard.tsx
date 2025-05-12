// src/components/turkeyDice/Arcade/TurkeyDiceScoreCard.tsx
import React from 'react';
import styles from './TurkeyDiceScoreCard.module.css';

interface TurkeyDiceScoreCardProps {
  playerName?: string;
  score?: number;
}

const TurkeyDiceScoreCard: React.FC<TurkeyDiceScoreCardProps> = ({ 
  playerName = "[알렉산더 3세]", 
  score = 270 
}) => {
  const categories = [
    '에이스', '듀얼', '트리플', '퀴드', '펜타', '헥사', '포커', '풀하우스', 
    'S.S', 'L.S', '터키', '찬스'
  ];

  return (
    <div className={styles.scoreCardContainer}>
      <div className={styles.scoreCardInner}>
        <div className={styles.header}>
            <h1 className={styles.title}>{playerName}</h1>
            <div className={styles.score}>SCORE {score}</div>
        </div>
        
        <div style={{ position: 'relative' }}>
            <div className={styles.divider}></div>
            <ul className={styles.categoryList}>
            {categories.map((category, index) => (
                <li key={index} className={styles.categoryItem}>
                <span className={styles.categoryName}>{category}</span>
                </li>
            ))}
            </ul>
        </div>
        
        <div className={styles.buttonArea}>
            <button className={styles.rerollButton}>REROLL</button>
            <button className={styles.nextTurnButton}>NEXT TURN</button>
        </div>
        </div>
    </div>
  );
};

export default TurkeyDiceScoreCard;
