import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerOption from '../../../components/common/PlayerOption/PlayerOption';
import styles from './GameOptions.module.css';

export default function TurkeyDiceOptions() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [players, setPlayers] = useState<number>(2);
  const [board, setBoard] = useState<string>('classic');

  // 단계별 컨텐츠 렌더링
  const renderStepContent = () => {
    switch(step) {
      case 0:
        return (
          <PlayerOption 
            options={[2, 3, 4]}
            selected={players}
            onSelect={(count) => {
              setPlayers(count);
              setStep(1);
            }}
            title="🎲 플레이어 수를 선택하세요"
          />
        );
      case 1:
        return (
          <div className={styles.boardSelect}>
            <h2>🃏 게임 보드 스타일</h2>
            <div className={styles.boardGrid}>
              {['classic', 'gold', 'premium'].map((type) => (
                <button
                  key={type}
                  className={`${styles.boardCard} ${board === type ? styles.active : ''}`}
                  onClick={() => setBoard(type)}
                >
                  <img 
                    src={`/images/boards/${type}-board.png`} 
                    alt={`${type} board`}
                  />
                  <span>{{
                    classic: '클래식 보드',
                    gold: '골드 에디션',
                    premium: '프리미엄 보드'
                  }[type]}</span>
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => step > 0 ? setStep(s => s-1) : navigate(-1)}
        >
          ←
        </button>
        <div className={styles.stepIndicator}>
          {[0, 1].map((num) => (
            <div 
              key={num}
              className={`${styles.stepDot} ${step >= num ? styles.active : ''}`}
            />
          ))}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className={styles.content}>
        {renderStepContent()}
      </div>

      {/* 하단 액션 버튼 */}
      {step === 1 && (
        <div className={styles.actionButtons}>
          <button
            className={styles.startButton}
            onClick={() => navigate(`/games/turkey-dice/play?players=${players}&board=${board}`)}
          >
            게임 시작하기
          </button>
        </div>
      )}
    </div>
  );
}
