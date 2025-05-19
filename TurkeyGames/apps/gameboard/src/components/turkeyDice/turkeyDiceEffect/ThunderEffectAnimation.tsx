// src/components/turkeyDice/turkeyDiceEffect/ThunderEffectAnimation.tsx

import React, { useEffect } from 'react';

const frameCount = 4;
const frameDuration = 100;

const framePaths = Array.from(
  { length: frameCount },
  (_, i) =>
    new URL(
      `../../../assets/effects/thunder/thunder${i + 1}.png`,
      import.meta.url
    ).href
);

// 하드코딩된 번개 위치
const positions = [
  { x: 1300, y: 600 },
  { x: 400, y: 250 },
  { x: 600, y: 350 },
  { x: 800, y: 200 },
  { x: 1000, y: 400 },
];

const ThunderEffectAnimation: React.FC = () => {
  useEffect(() => {
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

      // 무한 루프
      const loop = setInterval(() => {
        img.src = framePaths[current];
        current = (current + 1) % framePaths.length;
      }, frameDuration);

      // 컴포넌트 언마운트 시 정리
      return () => {
        clearInterval(loop);
        img.remove();
      };
    });
  }, []);

  return null;
};

export default ThunderEffectAnimation;
