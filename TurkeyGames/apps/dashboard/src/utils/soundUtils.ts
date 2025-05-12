// src/utils/soundUtils.ts
let isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';

// 소리 설정 변경 이벤트
const SOUND_SETTING_CHANGE = 'SOUND_SETTING_CHANGE';

export const getSoundEnabled = () => {
  return isSoundEnabled;
};

export const setSoundEnabled = (value: boolean) => {
  isSoundEnabled = value;
  localStorage.setItem('soundEnabled', value.toString());
  
  // 이벤트 발생
  window.dispatchEvent(new CustomEvent(SOUND_SETTING_CHANGE, { detail: value }));
};

export const playSound = (soundSrc: string) => {
 // console.log('Play sound called, sound enabled:', isSoundEnabled);
  if (isSoundEnabled) {
    const audio = new Audio(soundSrc);
    audio.play().catch(e => console.error("오디오 재생 실패:", e));
  } else {
   // console.log('Sound is disabled, not playing');
  }
};

// 소리 설정 변경 이벤트 리스너 등록
export const onSoundSettingChange = (callback: (enabled: boolean) => void) => {
  const handler = (event: CustomEvent) => callback(event.detail);
  window.addEventListener(SOUND_SETTING_CHANGE as any, handler as EventListener);
  return () => window.removeEventListener(SOUND_SETTING_CHANGE as any, handler as EventListener);
};
