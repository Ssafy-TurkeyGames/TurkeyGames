import React, { useState, useRef } from 'react';
import styles from './VoiceOption.module.css';
import Button from '../common/Button/Button';
import userIcon from '../../assets/images/user.png';
import boardIcon from '../../assets/images/board.png';
import micIcon from '../../assets/images/mic.png';
import turkeyIcon from '../../assets/images/turkey.png';
import arcadeIcon from '../../assets/images/arcade.png';

// 오디오 파일 import
import daegilGreeting from '../../assets/voice/daegil/인사.mp3';
import gaenariGreeting from '../../assets/voice/flower/인사.mp3';

interface VoiceOptionProps {
  selectedVoice: string | null;
  onSelect: (voice: string) => void;
  players: number;
  selectedBoard: 'Turkey' | 'Arcade';
  onConfirm: () => void;
  onCancel: () => void;
}

const VOICE_OPTIONS = [
  "대길", "개나리", "애니"
];

export default function VoiceOption({
  selectedVoice,
  onSelect,
  players,
  selectedBoard,
  onConfirm,
  onCancel
}: VoiceOptionProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playVoice = (voice: string) => {
    // 기존 오디오 중지
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // 새 오디오 재생
    let audioSrc = '';
    if (voice === "대길") {
      audioSrc = daegilGreeting;
    } else if (voice === "개나리") {
      audioSrc = gaenariGreeting;
    }

    if (audioSrc) {
      audioRef.current = new Audio(audioSrc);
      audioRef.current.play().catch(e => console.error("오디오 재생 실패:", e));
    }

    // 선택 상태 업데이트
    onSelect(voice);
  };

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
          <Button
            key={voice}
            active={selectedVoice === voice}
            onClick={() => playVoice(voice)}
            className={styles.voiceBtn}
            style={{ width: 120, margin: 0 }}
          >
            {voice}
          </Button>
        ))}
      </div>
      
      <div className={styles.buttonRow}>
        <Button 
          variant="outline" 
          onClick={onCancel}
          className={styles.smallBtn}
        >
          취소
        </Button>
        <Button 
          variant="primary" 
          onClick={onConfirm} 
          disabled={!selectedVoice}
          className={styles.smallBtn}
        >
          확인
        </Button>
      </div>
    </div>
  );
}
