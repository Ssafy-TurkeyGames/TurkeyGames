// src/pages/Default.tsx
import React, { useState } from 'react';
import styles from './Default.module.css'; // Default.module.css 파일 경로가 맞는지 확인
import SpinTurkey from '../../components/common/spinTurkey/SpinTurkey';
import turkey from '../../assets/images/turkey.png';

// 이펙트 컴포넌트들을 직접 임포트합니다.
import HeartEffect from '../../components/turkeyDice/turkeyDiceEffect/HeartEffect';
import ExplosionEffect from '../../components/turkeyDice/turkeyDiceEffect/ExplosionEffect';

// 이펙트 위치와 타입을 정의하는 인터페이스
interface EffectPositionWithRandomType {
  x: number;
  y: number;
  withSound?: boolean;
  type: 'heart' | 'explosion'; // 'heart' 또는 'explosion' 타입을 명시
}

export default function Default() {
  // 현재 활성화된 이펙트들의 위치와 타입을 저장하는 상태
  const [activeEffectPositions, setActiveEffectPositions] = useState<
    EffectPositionWithRandomType[]
  >([]);

  // 이펙트를 보여주는 함수 (웹소켓에서 좌표를 받았다고 가정)
  const showEffects = () => {
    // 미리 정의된 5개의 고정 좌표 (사운드 여부도 포함)
    const predefinedPositions: Omit<EffectPositionWithRandomType, 'type'>[] = [
      { x: 200, y: 300 },
      { x: 500, y: 250 },
      { x: 800, y: 400 },
      { x: 400, y: 550 },
      { x: 700, y: 150 },
    ];

    // 5개 좌표에 적용될 단일 이펙트 종류를 랜덤으로 선택합니다.
    const chosenEffectType: 'heart' | 'explosion' =
      Math.random() > 0.5 ? 'heart' : 'explosion';

    // 선택된 단일 이펙트 종류를 모든 좌표에 적용합니다.
    const newEffectsWithTypes: EffectPositionWithRandomType[] =
      predefinedPositions.map((pos, idx) => ({
        ...pos,
        type: chosenEffectType,
        withSound: idx === 0, // 첫 번째만 true
      }));

    // 상태를 업데이트하여 이펙트들을 화면에 표시합니다.
    setActiveEffectPositions(newEffectsWithTypes); //배열을 상태에 저장하는 코드
  };

  return (
    <div className={styles.layout}>
      <div
        style={{ position: 'absolute', top: 20, display: 'flex', gap: '1rem' }}
      >
        <button onClick={showEffects}>
          🚀 이펙트 5개 실행 (하드코딩 좌표)
        </button>
      </div>

      <SpinTurkey image={turkey} />

      {/* activeEffectPositions 배열을 순회하며 각 이펙트를 렌더링합니다. */}
      {activeEffectPositions.map((pos, index) => {
        // 'type' 속성에 따라 렌더링할 이펙트 컴포넌트를 동적으로 결정합니다.
        // 이제 activeEffectPositions 내의 모든 요소의 type은 동일합니다.
        const EffectComponent =
          pos.type === 'heart' ? HeartEffect : ExplosionEffect;

        return (
          <EffectComponent
            key={`${pos.x}-${pos.y}-${pos.type}-${index}`} // React의 key prop은 필수!
            x={pos.x}
            y={pos.y}
            withSound={pos.withSound}
          />
        );
      })}
    </div>
  );
}
