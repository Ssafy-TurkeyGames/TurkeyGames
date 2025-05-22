// components/games/TurkeyDice/BoardSelect.tsx
import React from 'react';
import styles from './BoardSelect.module.css';
import Button from '../../common/Button/Button';
import turkeyIcon from '../../../assets/images/turkey.png';
import arcadeIcon from '../../../assets/images/arcade.png';
import boardIcon from '../../../assets/images/board.png';
import userIcon from '../../../assets/images/user.png';

interface BoardSelectProps {
  selectedBoard: 'Turkey' | 'Arcade' | null;
  onSelect: (board: 'Turkey' | 'Arcade') => void;
  players: number;
  onNextStep: () => void;
  onPrevStep: () => void;
}

export default function BoardSelect({ 
  selectedBoard, 
  onSelect, 
  players, 
  onNextStep,
  onPrevStep
}: BoardSelectProps) {
  return (
    <div className={styles.stepBox}>
      <div className={styles.playerBadgeRow}>
        <img src={userIcon} alt="플레이어" className={styles.iconSmall} />
        <div className={styles.badge}>{players}인</div>
        <img src={boardIcon} alt="보드" className={styles.iconSmall} />
      </div>
      
      <div className={styles.boardGrid}>
        <div 
          className={`${styles.boardCard} ${selectedBoard === 'Turkey' ? styles.active : ''}`}
          onClick={() => onSelect('Turkey')}
        >
          <img src={turkeyIcon} alt="꼬끼오 결투장" />
          <span>꼬끼오 결투장</span>
        </div>
        <div 
          className={`${styles.boardCard} ${selectedBoard === 'Arcade' ? styles.active : ''}`}
          onClick={() => onSelect('Arcade')}
        >
          <img src={arcadeIcon} alt="아케이드 결투장" />
          <span>아케이드 결투장</span>
        </div>
      </div>
      
      <div className={styles.navBtns}>
        <Button 
          variant="outline" 
          onClick={onPrevStep}
          className="small"
        >
          이전
        </Button>
        <Button 
          variant="primary" 
          onClick={onNextStep} 
          disabled={!selectedBoard}
          className="small"
        >
          다음
        </Button>
      </div>
    </div>
  );
}
