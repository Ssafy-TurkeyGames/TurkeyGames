// src/components/turkeyDice/turkeyDiceEffect/ExplosionEffectAnimation.tsx

import React, { useEffect } from 'react';

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
const positions = [
  { x: 1300, y: 600 },
  { x: 400, y: 250 },
  { x: 600, y: 350 },
  { x: 800, y: 200 },
  { x: 1000, y: 400 },
];

const ExplosionEffectAnimation: React.FC = () => {
  useEffect(() => {
    const audio = new Audio('/sounds/magic6.mp3');
    audio.play().catch((err) => console.warn('🎵 사운드 재생 실패:', err));

    positions.forEach(({ x, y }) => {
      let current = 0;
      const img = document.createElement('img');

      Object.assign(img.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
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
  }, []);

  return null;
};

export default ExplosionEffectAnimation;
