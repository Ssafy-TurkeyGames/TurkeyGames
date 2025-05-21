// src/components/turkeyDice/turkeyDiceEffect/ExplosionEffectAnimation.tsx

import React, { useEffect } from 'react';
import effectSoundFile from '../../../assets/sound/explosion/explosion.mp3';

const frameCount = 9;
const frameDuration = 110;

const framePaths = Array.from(
  { length: frameCount },
  (_, i) =>
    new URL(
      `../../../assets/effects/explosion/explosion${i + 1}.png`,
      import.meta.url
    ).href
);

// 하드코딩된 좌표들
// const positions = [
//   { x: 1300, y: 600 },
//   { x: 400, y: 250 },
//   { x: 600, y: 350 },
//   { x: 800, y: 200 },
//   { x: 1000, y: 400 },
// ];

interface ExplosionEffectAnimationProps {
  coords: [number, number][];
}

const ExplosionEffectAnimation: React.FC<ExplosionEffectAnimationProps> = ({ coords }) => {
  useEffect(() => {
    coords.forEach(([xRatio, yRatio]) => {
      // const x = xRatio * window.innerWidth;
      // const y = yRatio * window.innerHeight;

      // // 화면 중심
      // const cx = window.innerWidth / 2;
      // const cy = window.innerHeight / 2;

      // // 반시계 방향 90도 회전
      // const rotatedX = cx - (y - cy);
      // const rotatedY = cy + (x - cx);

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // // 기본 좌표 계산
      // const x = xRatio * screenWidth;
      // const y = yRatio * screenHeight;

      

      // 화면 중심
      const cx = screenWidth / 2;
      const cy = screenHeight / 2;

       // 기본 좌표 계산 - 좌표 압축 계수 추가 (x 좌표를 더 좁게 만들기 위해)
      const compressionFactor = 0.6; // 이 값을 조절하여 x 좌표 압축 정도를 변경할 수 있습니다
      const x = (xRatio * screenWidth - cx) * compressionFactor + cx;
      const y = yRatio * screenHeight;

      // ✅ 화면 비율 보정 (16:9 기준)
      const targetRatio = 16 / 9;
      const currentRatio = screenWidth / screenHeight;

      let scaledX = x;
      let scaledY = y;

      if (currentRatio > targetRatio) {
        // 화면이 더 넓을 때: X축 보정 필요
        const scale = currentRatio / targetRatio;
        scaledX = (cx + (x - cx)) / scale;
      } else {
        // 화면이 더 좁을 때: Y축 보정 필요
        const scale = targetRatio / currentRatio;
        scaledY = (cy + (y - cy)) / scale;
      }

      // 반시계 방향 90도 회전
      const rotatedX = cx - (scaledY - cy);
      const rotatedY = cy + (scaledX - cx);

      const audio = new Audio(`${effectSoundFile}`);
      audio.play().catch((err) => console.warn('🎵 사운드 재생 실패:', err));

      let current = 0;
      const img = document.createElement('img');

      Object.assign(img.style, {
        position: 'absolute',
        left: `${rotatedX}px`,
        top: `${rotatedY}px`,
        transform: 'translate(-50%, -50%) scale(1.2)',
        pointerEvents: 'none',
        width: '300px',
        height: '300px',
        zIndex: '999',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        mixBlendMode: 'screen',
      });

      document.body.appendChild(img);

      const interval = setInterval(() => {
        if (current >= framePaths.length) {
          clearInterval(interval);
          img.remove();
        } else {
          img.src = framePaths[current];
          current++;
        }
      }, frameDuration);
    });
  }, [coords]);

  return null;
};

export default ExplosionEffectAnimation;
