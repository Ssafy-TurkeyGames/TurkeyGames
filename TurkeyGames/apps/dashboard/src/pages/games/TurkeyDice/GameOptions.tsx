import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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


const VOICE_OPTIONS = [
  "카우보이", "치킨집 사장", "외계인",
  "군인", "요정", "발키리",
  "티모", "사코", "니코"
];

export default function TurkeyDiceOptions() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0: 인원, 1: 보드, 2: 목소리, 3: 최종확인
    const [players, setPlayers] = useState<number | null>(null);
    const [board, setBoard] = useState<'Turkey' | 'Arcade' | null>(null);
    const [voice, setVoice] = useState<string | null>(null);
  
    // 0단계: 인원 선택
    const renderPlayerStep = () => (
      <div className={styles.stepBox}>
        <button className={styles.closeBtn} onClick={() => navigate(-1)}>
          <img src={closeIcon} alt="닫기" />
        </button>
        <img src={userIcon} alt="플레이어" className={styles.bigIcon} />
        <div className={styles.playerBtnGroup}>
          {[2,3,4].map(n => (
            <button
              key={n}
              className={`${styles.playerBtn} ${players===n ? styles.active : ''}`}
              onClick={() => setPlayers(n)}
            >
              {n}인
            </button>
          ))}
        </div>
        <button
          className={styles.nextBtn}
          disabled={players === null}
          onClick={() => setStep(1)}
        >다음</button>
      </div>
    );
  
    // 1단계: 보드 선택
    const renderBoardStep = () => (
      <div className={styles.stepBox}>
        <button className={styles.closeBtn} onClick={() => navigate(-1)}>
          <img src={closeIcon} alt="닫기" />
        </button>
        <div className={styles.playerBadgeRow}>
          <img src={userIcon} alt="플레이어" className={styles.iconSmall} />
          <div className={styles.badge}>{players}인</div>
          <img src={boardIcon} alt="보드" className={styles.iconSmall} />
        </div>
        <div className={styles.boardGrid}>
          <button
            className={`${styles.boardCard} ${board === 'Turkey' ? styles.active : ''}`}
            onClick={() => setBoard('Turkey')}
          >
            <img src={turkeyImg} alt="꼬끼오 결투장" />
            <span>꼬끼오 결투장</span>
          </button>
          <button
            className={`${styles.boardCard} ${board === 'Arcade' ? styles.active : ''}`}
            onClick={() => setBoard('Arcade')}
          >
            <img src={arcadeImg} alt="아케이드 결투장" />
            <span>아케이드 결투장</span>
          </button>
        </div>
        <button
          className={styles.nextBtn}
          disabled={board === null}
          onClick={() => setStep(2)}
        >다음</button>
      </div>
    );
  
    // 2단계: 목소리 선택
    const renderVoiceStep = () => (
      <div className={styles.stepBox}>
        <button className={styles.closeBtn} onClick={() => navigate(-1)}>
          <img src={closeIcon} alt="닫기" />
        </button>
        <div className={styles.playerBadgeRow}>
          <img src={userIcon} alt="플레이어" className={styles.iconSmall} />
          <div className={styles.badge}>{players}인</div>
          <img src={boardIcon} alt="보드" className={styles.iconSmall} />
          <img
            src={board === 'Turkey' ? turkeyImg : arcadeImg}
            alt={board === 'Turkey' ? "꼬끼오 결투장" : "아케이드 결투장"}
            className={styles.boardMini}
          />
        </div>
        <img src={micIcon} alt="마이크" className={styles.bigIcon} />
        <div className={styles.voiceGrid}>
          {VOICE_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`${styles.voiceBtn} ${voice === opt ? styles.active : ''}`}
              onClick={() => setVoice(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className={styles.voiceNavBtns}>
          <button className={styles.confirmBtn}
            disabled={!voice}
            onClick={() => setStep(3)}
          >확인</button>
          <button className={styles.cancelBtn}
            onClick={() => setStep(1)}
          >취소</button>
        </div>
      </div>
    );
  
    // 3단계: 최종 확인 및 게임 시작
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
        <button
          className={styles.startBtn}
          onClick={() => {
            // 실제 게임 시작 로직
            alert(`게임 시작!\n${players}인, ${board}, ${voice}`);
            // navigate(`/games/turkey-dice/play?players=${players}&board=${board}&voice=${voice}`);
          }}
        >
          게임 시작
        </button>
      </div>
    );
  
    // 단계별 화면
    return (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {/* 닫기 버튼 */}
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
                <button
                className={styles.nextBtn}
                disabled={players === null}
                onClick={() => setStep(1)}
                >다음</button>
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