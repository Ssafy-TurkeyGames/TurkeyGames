// components/common/games/VoiceOption.tsx
import React, { useRef, useState, useEffect } from 'react';
import styles from './VoiceOption.module.css';
import Button from '../common/Button/Button';
import userIcon from '../../assets/images/user.png';
import boardIcon from '../../assets/images/board.png';
import micIcon from '../../assets/images/mic.png';
import turkeyIcon from '../../assets/images/turkey.png';
import arcadeIcon from '../../assets/images/arcade.png';
import { getSoundEnabled, playSound, onSoundSettingChange  } from '../../utils/soundUtils';

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
  const [soundEnabled, setSoundEnabled] = useState(getSoundEnabled());
  
  // 소리 설정 변경 이벤트 리스너 등록
  useEffect(() => {
    const unsubscribe = onSoundSettingChange((enabled) => {
      // console.log('VoiceOption received sound setting change:', enabled);
      setSoundEnabled(enabled);
    });
    
    return unsubscribe;
  }, []);

  const handleVoiceSelect = (voice: string) => {
  //  console.log('Voice selected:', voice, 'Sound enabled:', soundEnabled);
    
    // 소리 재생 (소리 설정이 켜져 있을 때만)
    if (soundEnabled) {
      if (voice === "대길") {
        playSound(daegilGreeting);
      } else if (voice === "개나리") {
        playSound(gaenariGreeting);
      }
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
            onClick={() => handleVoiceSelect(voice)}
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