// src/components/turkeyDice/turkeyDiceEffect/HeartEffectAnimation.tsx

import React, { useEffect } from 'react';

const frameCount = 20;
const frameDuration = 50;
const startFrameIndex = 0;

const framePaths = Array.from(
  { length: frameCount },
  (_, i) =>
    new URL(
      `../../../assets/effects/heart/Fx06_${String(
        i + startFrameIndex
      ).padStart(2, '0')}.png`,
      import.meta.url
    ).href
);

// 💡 하드코딩된 좌표 리스트
// const positions = [
//   { x: 100, y: 200 },
//   { x: 300, y: 400 },
//   { x: 500, y: 500 },
//   { x: 700, y: 300 },
//   { x: 900, y: 600 },
// ];

interface HeartEffectAnimationProps {
  coords: [number, number][];
}

const HeartEffectAnimation: React.FC<HeartEffectAnimationProps> = ({ coords }) => {
  useEffect(() => {
    coords.forEach(([xRatio, yRatio]) => {
      const y = xRatio * window.innerWidth;
      const x = yRatio * window.innerHeight;

      const audio = new Audio('/sounds/magic6.mp3');
      audio.play().catch((err) => console.warn('🎵 사운드 재생 실패:', err));

      let current = 0;
      const img = document.createElement('img');

      Object.assign(img.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%) scale(1.2)',
        pointerEvents: 'none',
        width: '200px',
        height: '200px',
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

export default HeartEffectAnimation;