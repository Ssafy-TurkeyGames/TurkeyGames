// src/components/turkeyDice/turkeyDiceEffect/HeartEffect.tsx
import React from 'react';
import SpriteEffect from './SpriteEffect';
// 하트 이펙트의 프레임 이미지 경로 설정
const framePaths = Array.from(
  { length: 20 }, // 총 20개의 프레임 (Fx06_00.png ~ Fx06_19.png)
  (_, i) =>
    new URL(
      `../../../assets/effects/heart/Fx06_${String(i).padStart(2, '0')}.png`, // 파일명 패턴
      import.meta.url
    ).href
);

// ❤️ 하트 이펙트 전용 사운드 파일 경로 (magicSound2.mp3로 변경)
const heartSoundPath = new URL(
  '../../../assets/sound/effectsound/twinkle1.mp3', // 👈 여기를 변경했습니다!
  import.meta.url
).href;

interface Props {
  x: number;
  y: number;
  withSound?: boolean; // 사운드 재생 여부 (선택적)
}

const HeartEffect = ({ x, y, withSound }: Props) => {
  return (
    <SpriteEffect
      x={x}
      y={y}
      framePaths={framePaths} // 정의된 프레임 경로 전달
      frameDuration={60} // 각 프레임 표시 시간 (ms)
      width="200px" // 이펙트의 너비
      height="200px" // 이펙트의 높이
      withSound={withSound} // 부모로부터 받은 사운드 여부 전달
      soundPath={heartSoundPath} // HeartEffect 전용 사운드 경로 전달
      scale={1.2} // 하트 이펙트는 기본 스케일로 (SpriteEffect의 기본값과 동일)
    />
  );
};

export default HeartEffect;
