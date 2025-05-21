import React, { useState } from 'react';
import styles from './Test.module.css';
import HeartEffectAnimation from '../../components/turkeyDice/turkeyDiceEffect/HeartEffectAnimation';
import ExplosionEffectAnimation from '../../components/turkeyDice/turkeyDiceEffect/ExplosionEffectAnimation';



export default function Test() {
  const [effectType, setEffectType] = useState<'heart' | 'explosion' | null>(null);

  const handleEffect = () => {
    if (effectType !== null) return;

    const randomEffect = Math.random() < 0.5 ? 'heart' : 'explosion';
    setEffectType(randomEffect);

    const duration = 1000; // 애니메이션 길이에 맞게 조정
    setTimeout(() => setEffectType(null), duration);
  };

  return (
    <div className={styles.layout}>
      <button onClick={handleEffect} disabled={effectType !== null}>
        이펙트 실행
      </button>
      {effectType === 'heart' && <HeartEffectAnimation />}
      {effectType === 'explosion' && <ExplosionEffectAnimation />}
    </div>
  )
}
