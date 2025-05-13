// components/common/games/VoiceOption.tsx
import React, { useRef, useState, useEffect } from 'react';
import styles from './VoiceOption.module.css';
import Button from '../common/Button/Button';
import userIcon from '../../assets/images/user.png';
import boardIcon from '../../assets/images/board.png';
import micIcon from '../../assets/images/mic.png';
import turkeyIcon from '../../assets/images/turkey.png';
import arcadeIcon from '../../assets/images/arcade.png';
import { 
  getSoundEnabled, 
  playSound, 
  onSoundSettingChange, 
  stopSoundsByCategory,
  stopAllSounds
} from '../../utils/soundUtils';

// 오디오 파일 import
import daegilGreeting from '../../assets/voice/daegil/인사.mp3';
import gaenariGreeting from '../../assets/voice/flower/인사.mp3';
import guriGreeting from '../../assets/voice/guri/인사.mp3';

// 음성 오디오 카테고리 이름 (오디오 관리용)
const VOICE_AUDIO_CATEGORY = 'voice-selection';

interface VoiceOptionProps {
  selectedVoice: string | null;
  onSelect: (voice: string) => void;
  players: number;
  selectedBoard: 'Turkey' | 'Arcade';
  onConfirm: () => void;
  onCancel: () => void;
}

const VOICE_OPTIONS = [
  "대길", "개나리", "구리"
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
      setSoundEnabled(enabled);
    });
    
    return unsubscribe;
  }, []);

  // 컴포넌트 언마운트 시 모든 음성 오디오 중지
  useEffect(() => {
    // 컴포넌트가 언마운트될 때 실행되는 정리 함수
    return () => {
      // 음성 선택 카테고리의 모든 오디오 중지
      stopSoundsByCategory(VOICE_AUDIO_CATEGORY);
    };
  }, []);

  // 확인 버튼 클릭 시 음성 중지 후 다음 단계로 이동
  const handleConfirm = () => {
    // 음성 선택 카테고리의 모든 오디오 중지
    stopSoundsByCategory(VOICE_AUDIO_CATEGORY);
    // 다음 단계로 이동
    onConfirm();
  };

  // 취소 버튼 클릭 시 음성 중지 후 이전 단계로 이동
  const handleCancel = () => {
    // 음성 선택 카테고리의 모든 오디오 중지
    stopSoundsByCategory(VOICE_AUDIO_CATEGORY);
    // 이전 단계로 이동
    onCancel();
  };

  // 음성 선택 처리
  const handleVoiceSelect = (voice: string) => {
    // 소리 재생 (소리 설정이 켜져 있을 때만)
    if (soundEnabled) {
      // 음성에 따라 다른 인사말 재생
      // 세 번째 매개변수 true: 같은 카테고리의 이전 오디오를 중지하고 새 오디오 재생
      if (voice === "대길") {
        playSound(daegilGreeting, VOICE_AUDIO_CATEGORY, true);
      } else if (voice === "개나리") {
        playSound(gaenariGreeting, VOICE_AUDIO_CATEGORY, true);
      } else {
        playSound(guriGreeting, VOICE_AUDIO_CATEGORY, true);
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
          onClick={handleCancel}
          className={styles.smallBtn}
        >
          취소
        </Button>
        <Button 
          variant="primary" 
          onClick={handleConfirm} 
          disabled={!selectedVoice}
          className={styles.smallBtn}
        >
          확인
        </Button>
      </div>
    </div>
  );
}
