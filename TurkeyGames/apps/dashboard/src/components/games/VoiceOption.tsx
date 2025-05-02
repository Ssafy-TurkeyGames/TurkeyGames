// components/common/VoiceOption/VoiceOption.tsx
import React from 'react';
import styles from './VoiceOption.module.css';
import userIcon from '../../assets/images/user.png';
import boardIcon from '../../assets/images/board.png';
import micIcon from '../../assets/images/mic.png';
import turkeyIcon from '../../assets/images/turkey.png';
import arcadeIcon from '../../assets/images/arcade.png';

interface VoiceOptionProps {
  selectedVoice: string | null;
  onSelect: (voice: string) => void;
  players: number;
  selectedBoard: 'Turkey' | 'Arcade';
  onConfirm: () => void;
  onCancel: () => void;
}

const VOICE_OPTIONS = [
  "카우보이", "치킨집 사장", "외계인",
  "군인", "요정", "발키리",
  "티모", "사코", "니코"
];

export default function VoiceOption({
  selectedVoice,
  onSelect,
  players,
  selectedBoard,
  onConfirm,
  onCancel
}: VoiceOptionProps) {
  return (
    <div className={styles.voiceOptionContainer}>
      <div className={styles.iconRow}>
        <img src={userIcon} alt="플레이어" className={styles.iconSmall} />
        <div className={styles.badge}>{players}인</div>
        <img src={boardIcon} alt="보드" className={styles.iconSmall} />
        <img
          src={selectedBoard === 'Turkey' ? turkeyIcon : arcadeIcon}
          alt={selectedBoard === 'Turkey' ? "꼬끼오 결투장" : "아케이드 결투장"}
          className={styles.boardMini}
        />
      </div>
      
      <img src={micIcon} alt="마이크" className={styles.micIcon} />
      
      <div className={styles.voiceGrid}>
        {VOICE_OPTIONS.map(voice => (
          <button
            key={voice}
            className={`${styles.voiceBtn} ${selectedVoice === voice ? styles.active : ''}`}
            onClick={() => onSelect(voice)}
          >
            {voice}
          </button>
        ))}
      </div>
      
      <div className={styles.buttonRow}>
        <button 
          className={styles.confirmBtn}
          disabled={!selectedVoice}
          onClick={onConfirm}
        >
          확인
        </button>
        <button 
          className={styles.cancelBtn}
          onClick={onCancel}
        >
          취소
        </button>
      </div>
    </div>
  );
}
