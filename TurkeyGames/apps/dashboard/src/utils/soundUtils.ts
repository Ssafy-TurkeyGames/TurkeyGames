// src/utils/soundUtils.ts
// 초기 소리 설정 상태 (localStorage에서 가져옴)
let isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';

// 소리 설정 변경 이벤트 이름
const SOUND_SETTING_CHANGE = 'SOUND_SETTING_CHANGE';

// 현재 재생 중인 오디오 요소들을 추적하는 WeakSet (메모리 누수 방지)
const activeAudios = new Set<HTMLAudioElement>();

/**
 * 현재 소리 설정 상태를 반환
 */
export const getSoundEnabled = (): boolean => isSoundEnabled;

/**
 * 소리 설정 상태를 변경
 * @param value 새로운 소리 설정 상태
 */
export const setSoundEnabled = (value: boolean): void => {
  isSoundEnabled = value;
  localStorage.setItem('soundEnabled', value.toString());
  
  // 소리가 꺼지면 모든 재생 중인 오디오 중지
  if (!value) {
    stopAllSounds();
  }
  
  // 이벤트 발생
  window.dispatchEvent(new CustomEvent(SOUND_SETTING_CHANGE, { detail: value }));
};

/**
 * 소리를 재생. 소리 설정이 꺼져 있으면 재생하지 않음
 * @param soundSrc 재생할 소리의 경로
 */
export const playSound = (soundSrc: string): void => {
  if (!getSoundEnabled()) return;
  
  const audio = new Audio(soundSrc);
  
  // 재생 중인 오디오 목록에 추가
  activeAudios.add(audio);
  
  // 재생이 끝나면 목록에서 제거
  audio.addEventListener('ended', () => {
    activeAudios.delete(audio);
  });
  
  // 오류 발생 시 목록에서 제거
  audio.addEventListener('error', () => {
    activeAudios.delete(audio);
  });
  
  // 소리 재생
  audio.play().catch(e => {
    console.error("오디오 재생 실패:", e);
    activeAudios.delete(audio);
  });
};

/**
 * 모든 재생 중인 소리를 중지
 */
export const stopAllSounds = (): void => {
  activeAudios.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
    activeAudios.delete(audio);
  });
};

/**
 * 소리 설정 변경 이벤트 리스너를 등록
 * @param callback 소리 설정이 변경될 때 호출될 콜백 함수
 * @returns 이벤트 리스너 제거 함수
 */
export const onSoundSettingChange = (callback: (enabled: boolean) => void): (() => void) => {
  const handler = ((event: CustomEvent<boolean>) => callback(event.detail)) as EventListener;
  window.addEventListener(SOUND_SETTING_CHANGE, handler);
  return () => window.removeEventListener(SOUND_SETTING_CHANGE, handler);
};
