import React, { useState } from 'react';
import {
  effectMap,
  GameMode,
} from '../../components/turkeyDice/turkeyDiceEffect/effectMap';
import styles from './Default.module.css';
import turkey from '../../assets/images/turkey.png';
import SpinTurkey from '../../components/common/spinTurkey/SpinTurkey';

export default function Default() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [EffectComponent, setEffectComponent] =
    useState<React.ComponentType | null>(null);

  const handleModeClick = (selectedMode: GameMode) => {
    setMode(selectedMode);
    const effects = effectMap[selectedMode];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
    setEffectComponent(() => randomEffect);
  };

  return (
    <div className={styles.layout}>
      {/* 🔝 모드 선택 버튼 - 상단 고정 */}
      <div className={styles.modeButtons}>
        <button onClick={() => handleModeClick('turkey')}>
          🐔 Turkey 모드
        </button>
        <button onClick={() => handleModeClick('arcade')}>
          🎲 Arcade 모드
        </button>
      </div>

      {/* 🦃 항상 보이는 터키 이미지 */}
      <SpinTurkey image={turkey} />

      {/* 💥 이펙트 컴포넌트 */}
      <div style={{ marginTop: '2rem' }}>
        {EffectComponent ? <EffectComponent /> : <p>이펙트를 선택하세요</p>}
      </div>
    </div>
  );
}
