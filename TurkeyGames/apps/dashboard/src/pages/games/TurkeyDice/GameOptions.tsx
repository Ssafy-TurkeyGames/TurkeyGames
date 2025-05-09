/* apps/dashboard/src/pages/games/TurkeyDice/GameOptions.tsx */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button/Button';
import PlayerOption from '../../../components/common/PlayerOption/PlayerOption';
import BoardSelect from '../../../components/games/TurkeyDice/BoardSelect';
import VoiceOption from '../../../components/games/VoiceOption';
import styles from './GameOptions.module.css';
import userIcon from '../../../assets/images/user.png';
import boardIcon from '../../../assets/images/board.png';
import micIcon from '../../../assets/images/mic.png';
import turkeyIcon from '../../../assets/images/turkey.png';
import arcadeIcon from '../../../assets/images/arcade.png';
import closeIcon from '../../../assets/images/close (1).png';

export default function TurkeyDiceOptions() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [players, setPlayers] = useState<number | null>(null);
  const [board, setBoard] = useState<'Turkey' | 'Arcade' | null>(null);
  const [voice, setVoice] = useState<string | null>(null);

  // 최종 확인
  const renderFinalStep = () => (
    <div className={styles.stepBox}>
      <button className={styles.closeBtn} onClick={() => navigate(-1)}>
        <img src={closeIcon} alt="닫기" />
      </button>
      <div className={styles.finalRow}>
        <div>
          <img src={userIcon} alt="플레이어" className={styles.iconSmall} />
          <div className={styles.badge}>{players}인</div>
        </div>
        <div>
          <img src={boardIcon} alt="보드" className={styles.iconSmall} />
          <div className={styles.badge}>
            {board === 'Turkey' ? "꼬끼오 결투장" : "아케이드 결투장"}
          </div>
        </div>
        <div>
          <img src={micIcon} alt="마이크" className={styles.iconSmall} />
          <div className={styles.badge}>{voice}</div>
        </div>
      </div>
      <Button
        variant="primary"
        className={styles.startBtn}
        onClick={() => {
          navigate('/games/TurkeyDice/score');
        }}
      >
        게임 시작
      </Button>
    </div>
  );

  return (
    <div className={styles.optionsRoot}>
      <div className={styles.optionsCard}>
        <button className={styles.closeBtn} onClick={() => navigate(-1)}>
          <img src={closeIcon} alt="닫기" />
        </button>
        {step === 0 && (
          <div className={styles.centerWrap}>
            <PlayerOption
              options={[2, 3, 4]}
              selected={players}
              onSelect={setPlayers}
              title="플레이어 수를 선택하세요"
            />
            <Button
              variant="primary"
              disabled={players === null}
              onClick={() => setStep(1)}
            >
              다음
            </Button>
          </div>
        )}
        {step === 1 && (
          <BoardSelect
            selectedBoard={board}
            onSelect={setBoard}
            players={players!}
            onNextStep={() => setStep(2)}
            onPrevStep={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <VoiceOption
            selectedVoice={voice}
            onSelect={setVoice}
            players={players!}
            selectedBoard={board!}
            onConfirm={() => setStep(3)}
            onCancel={() => setStep(1)}
          />
        )}
        {step === 3 && renderFinalStep()}
      </div>
    </div>
  );
}
