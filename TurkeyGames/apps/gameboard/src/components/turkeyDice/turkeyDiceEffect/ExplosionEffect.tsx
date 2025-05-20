// src/components/turkeyDice/turkeyDiceEffect/ExplosionEffect.tsx
import React from 'react';
import SpriteEffect from './SpriteEffect';
// 폭발 이펙트의 프레임 이미지 경로 설정
const framePaths = Array.from(
  { length: 9 }, // 총 9개의 프레임 (explosion1.png ~ explosion9.png)
  (_, i) =>
    new URL(
      `../../../assets/effects/explosion/explosion${i + 1}.png`, // 파일명 패턴
      import.meta.url
    ).href
);

// 폭발 이펙트의 사운드 파일 경로 설정
const soundPath = new URL(
  '../../../assets/sound/effectsound/magic6.mp3',
  import.meta.url
).href;

interface Props {
  x: number;
  y: number;
  withSound?: boolean; // 사운드 재생 여부 (선택적)
}

// React.FC 대신 화살표 함수에 직접 Props 타입 적용
const ExplosionEffect = ({ x, y, withSound }: Props) => {
  // 여기에 Props 타입 명시
  return (
    <SpriteEffect
      x={x}
      y={y}
      framePaths={framePaths} // 정의된 프레임 경로 전달
      frameDuration={110} // 각 프레임 표시 시간 (ms)
      width="300px" // 이펙트의 너비
      height="300px" // 이펙트의 높이
      withSound={withSound} // 부모로부터 받은 사운드 여부 전달
      soundPath={soundPath} // 사운드 경로 전달
      scale={1.0} // 폭발 이펙트는 기본 스케일로 (SpriteEffect의 기본값 1.2와 다르게 설정)
    />
  );
};

export default ExplosionEffect;
