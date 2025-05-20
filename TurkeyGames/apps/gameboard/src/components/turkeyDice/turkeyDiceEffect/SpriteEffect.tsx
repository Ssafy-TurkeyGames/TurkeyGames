// src/components/common/SpriteEffect.tsx
import React, { useEffect, useState } from 'react';

interface SpriteEffectProps {
  x: number;
  y: number;
  framePaths?: string[]; // 이미지 프레임 경로 배열 (직접 지정)
  frameCount?: number; // 프레임 수 (자동 생성 시 필요)
  basePath?: string; // 이미지 기본 경로 (자동 생성 시 필요)
  filePrefix?: string; // 파일명 접두사 (자동 생성 시 필요, 예: 'Fx06_')
  fileExtension?: string; // 파일 확장자 (자동 생성 시 필요, 예: 'png')
  startIndex?: number; // 시작 인덱스 (자동 생성 시 필요, 예: 0)
  padLength?: number; // 숫자 패딩 길이 (자동 생성 시 필요, 예: 2 -> 01, 02)
  frameDuration?: number; // 각 프레임 표시 시간 (ms)
  scale?: number; // 이미지 스케일
  width?: string; // 이미지 너비
  height?: string; // 이미지 높이
  withSound?: boolean; // 사운드 재생 여부
  soundPath?: string; // 사운드 파일 경로
}

const SpriteEffect = ({
  x,
  y,
  framePaths,
  frameCount = 0,
  basePath = '',
  filePrefix = '',
  fileExtension = 'png',
  startIndex = 0,
  padLength = 0,
  frameDuration = 50,
  scale = 1.2,
  width = '200px',
  height = '200px',
  withSound = false,
  soundPath,
}: SpriteEffectProps) => {
  const [frame, setFrame] = useState(0);

  // framePaths가 직접 주어지지 않으면, basePath, filePrefix 등으로 경로를 생성
  // (이 부분은 HeartEffect/ExplosionEffect에서 framePaths를 직접 전달하므로 현재 사용되지 않습니다.)
  const generatedFramePaths = framePaths
    ? framePaths
    : Array.from(
        { length: frameCount },
        (_, i) =>
          new URL(
            `${basePath}${filePrefix}${String(i + startIndex).padStart(
              padLength,
              '0'
            )}.${fileExtension}`,
            import.meta.url
          ).href
      );

  useEffect(() => {
    // 사운드 재생 로직
    if (withSound && soundPath) {
      console.log(`🎵 Attempting to play sound: ${soundPath}`); // 디버깅용 로그
      const audio = new Audio(soundPath); // 매번 새 인스턴스 생성
      audio.volume = 1.0;
      audio.play().catch((err) => console.warn('🎵 사운드 재생 실패:', err));
    }

    // 애니메이션 프레임 변경 로직
    const interval = setInterval(() => {
      setFrame((f) => f + 1);
    }, frameDuration);

    // 컴포넌트 언마운트 시 인터벌 클리어 (메모리 누수 방지)
    return () => clearInterval(interval);
  }, [withSound, soundPath, frameDuration]); // 👈 의존성 배열 수정됨!

  // 모든 프레임이 재생되었으면 null 반환하여 컴포넌트 제거
  if (frame >= generatedFramePaths.length) return null;

  return (
    <img
      src={generatedFramePaths[frame]} // 현재 프레임 이미지 설정
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -50%) scale(${scale})`, // 중앙 정렬 및 스케일
        pointerEvents: 'none', // 마우스 이벤트 무시
        width,
        height,
        zIndex: 999, // 다른 요소 위에 표시
        mixBlendMode: 'screen', // 배경과 혼합 모드 (투명 효과 등)
      }}
      alt="effect sprite" // 접근성을 위한 alt 텍스트
    />
  );
};

export default SpriteEffect;
