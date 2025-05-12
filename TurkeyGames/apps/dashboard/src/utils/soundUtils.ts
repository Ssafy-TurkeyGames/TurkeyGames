// src/utils/soundUtils.ts
let isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';

// 소리 설정 변경 이벤트
const SOUND_SETTING_CHANGE = 'SOUND_SETTING_CHANGE';

// 현재 재생 중인 오디오 요소들을 추적
const activeAudios: HTMLAudioElement[] = [];

export const getSoundEnabled = () => {
  return isSoundEnabled;
};

export const setSoundEnabled = (value: boolean) => {
  isSoundEnabled = value;
  localStorage.setItem('soundEnabled', value.toString());
  
  // 소리가 꺼지면 모든 재생 중인 오디오 중지
  if (!value) {
    stopAllSounds();
  }
  
  // 이벤트 발생
  window.dispatchEvent(new CustomEvent(SOUND_SETTING_CHANGE, { detail: value }));
  
  // 디버깅용 로그
  console.log('Sound enabled set to:', value);
};

export const playSound = (soundSrc: string) => {
  // 함수 호출 시점에 getSoundEnabled()를 호출하여 최신 상태 확인
  const soundEnabled = getSoundEnabled();
  console.log('Play sound called, sound enabled:', soundEnabled);
  
  if (soundEnabled) {
    const audio = new Audio(soundSrc);
    
    // 재생 중인 오디오 목록에 추가
    activeAudios.push(audio);
    
    // 재생이 끝나면 목록에서 제거
    audio.addEventListener('ended', () => {
      const index = activeAudios.indexOf(audio);
      if (index !== -1) {
        activeAudios.splice(index, 1);
      }
    });
    
    audio.play().catch(e => console.error("오디오 재생 실패:", e));
  } else {
    console.log('Sound is disabled, not playing');
  }
};

// 모든 재생 중인 소리 중지
export const stopAllSounds = () => {
  console.log(`Stopping ${activeAudios.length} active sounds`);
  
  // 모든 재생 중인 오디오 중지
  activeAudios.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
  
  // 배열 비우기
  activeAudios.length = 0;
};

// 소리 설정 변경 이벤트 리스너 등록
export const onSoundSettingChange = (callback: (enabled: boolean) => void) => {
  const handler = (event: CustomEvent) => callback(event.detail);
  window.addEventListener(SOUND_SETTING_CHANGE as any, handler as EventListener);
  return () => window.removeEventListener(SOUND_SETTING_CHANGE as any, handler as EventListener);
};
