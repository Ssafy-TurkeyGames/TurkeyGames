// src/components/turkeyDice/turkeyDiceEffect/BulletImpactEffect.tsx

import React, { useEffect } from 'react';

const bulletImages = [
  new URL('../../../assets/effects/bullet/bullet1.png', import.meta.url).href,
  new URL('../../../assets/effects/bullet/bullet2.png', import.meta.url).href,
  new URL('../../../assets/effects/bullet/bullet3.png', import.meta.url).href,
];

// 하드코딩된 위치들
const positions = [
  { x: 1300, y: 600 },
  { x: 400, y: 250 },
  { x: 600, y: 350 },
  { x: 800, y: 200 },
  { x: 1000, y: 400 },
];

const BulletImpactEffect: React.FC = () => {
  useEffect(() => {
    positions.forEach(({ x, y }) => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          spawnBulletHole(x, y);
        }, i * 200); // 200ms 간격으로 표시
      }
    });

    function spawnBulletHole(x: number, y: number) {
      const img = document.createElement('img');
      const src = bulletImages[Math.floor(Math.random() * bulletImages.length)];

      const offsetX = Math.floor(Math.random() * 160 - 50); // -50 ~ +110px
      const offsetY = Math.floor(Math.random() * 160 - 50);

      img.src = src;
      img.style.position = 'absolute';
      img.style.left = `${x + offsetX}px`;
      img.style.top = `${y + offsetY}px`;
      img.style.width = '100px';
      img.style.height = '100px';
      img.style.transform = `translate(-50%, -50%) rotate(${
        Math.random() * 360
      }deg)`;
      img.style.pointerEvents = 'none';
      img.style.zIndex = '1000';

      document.body.appendChild(img);
    }
  }, []);

  return null;
};

export default BulletImpactEffect;
