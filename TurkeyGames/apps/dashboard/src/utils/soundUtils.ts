// src/utils/soundUtils.ts
// 초기 소리 설정 상태 (localStorage에서 가져옴)
let isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';

// 소리 설정 변경 이벤트 이름
const SOUND_SETTING_CHANGE = 'SOUND_SETTING_CHANGE';

// 현재 재생 중인 오디오 요소들을 카테고리별로 추적
interface AudioTracker {
  all: Set<HTMLAudioElement>;  // 모든 오디오
  categories: Map<string, Set<HTMLAudioElement>>;  // 카테고리별 오디오
}

const activeAudios: AudioTracker = {
  all: new Set<HTMLAudioElement>(),
  categories: new Map<string, Set<HTMLAudioElement>>()
};

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
 * @param category 오디오 카테고리 (선택사항)
 * @param stopPrevious 같은 카테고리의 이전 오디오 중지 여부 (기본값: false)
 * @returns 생성된 오디오 요소
 */
export const playSound = (
  soundSrc: string, 
  category?: string, 
  stopPrevious: boolean = false
): HTMLAudioElement | null => {
  // 소리 설정이 꺼져 있으면 재생하지 않음
  if (!getSoundEnabled()) return null;
  
  // 같은 카테고리의 이전 오디오 중지 (요청된 경우)
  if (category && stopPrevious) {
    stopSoundsByCategory(category);
  }
  
  const audio = new Audio(soundSrc);
  
  // 전체 오디오 목록에 추가
  activeAudios.all.add(audio);
  
  // 카테고리별 오디오 목록에 추가 (카테고리가 제공된 경우)
  if (category) {
    if (!activeAudios.categories.has(category)) {
      activeAudios.categories.set(category, new Set<HTMLAudioElement>());
    }
    activeAudios.categories.get(category)?.add(audio);
  }
  
  // 재생이 끝나면 목록에서 제거
  audio.addEventListener('ended', () => {
    removeAudioFromTrackers(audio, category);
  });
  
  // 오류 발생 시 목록에서 제거
  audio.addEventListener('error', () => {
    removeAudioFromTrackers(audio, category);
  });
  
  // 소리 재생
  audio.play().catch(e => {
    console.error("오디오 재생 실패:", e);
    removeAudioFromTrackers(audio, category);
  });
  
  return audio;
};

/**
 * 오디오를 모든 트래커에서 제거
 * @param audio 제거할 오디오 요소
 * @param category 오디오 카테고리 (선택사항)
 */
const removeAudioFromTrackers = (audio: HTMLAudioElement, category?: string): void => {
  // 전체 목록에서 제거
  activeAudios.all.delete(audio);
  
  // 카테고리별 목록에서 제거 (카테고리가 제공된 경우)
  if (category && activeAudios.categories.has(category)) {
    activeAudios.categories.get(category)?.delete(audio);
  }
};

/**
 * 특정 카테고리의 모든 소리를 중지
 * @param category 중지할 오디오 카테고리
 */
export const stopSoundsByCategory = (category: string): void => {
  if (!activeAudios.categories.has(category)) return;
  
  const categoryAudios = activeAudios.categories.get(category);
  if (!categoryAudios) return;
  
  categoryAudios.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
    activeAudios.all.delete(audio);
  });
  
  // 카테고리 오디오 목록 비우기
  categoryAudios.clear();
};

/**
 * 모든 재생 중인 소리를 중지
 */
export const stopAllSounds = (): void => {
  // 모든 오디오 중지
  activeAudios.all.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
  
  // 모든 오디오 목록 비우기
  activeAudios.all.clear();
  activeAudios.categories.clear();
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
