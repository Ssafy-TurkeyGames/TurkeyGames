import React, { useState } from 'react';
import HeartEffectAnimation from '../turkeyDiceEffect/HeartEffectAnimation';
import ExplosionEffectAnimation from '../turkeyDiceEffect/ExplosionEffectAnimation';



const EffectTrigger: React.FC = () => {
  const [effectType, setEffectType] = useState<'heart' | 'explosion' | null>(null);

  const handleClick = () => {
    if (effectType !== null) return; // 이미 이펙트 실행 중이면 무시

    const randomEffect = Math.random() < 0.5 ? 'heart' : 'explosion';
    setEffectType(randomEffect);

    // 실행 시간 후 자동 초기화
    const duration = randomEffect === 'heart' ? 1000 : 1000; // frameCount * frameDuration
    setTimeout(() => setEffectType(null), duration);
  };

  return (
    <div>
      <button onClick={handleClick} disabled={effectType !== null}>
        ✨ 이펙트 발동!
      </button>
      {effectType === 'heart' && <HeartEffectAnimation />}
      {effectType === 'explosion' && <ExplosionEffectAnimation />}
    </div>
  );
};

export default EffectTrigger;
