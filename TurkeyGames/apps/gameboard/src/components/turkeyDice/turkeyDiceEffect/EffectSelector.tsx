// gameboard/components/turkeyDice/turkeyDiceEffect/EffectSelector.tsx
import HeartEffectAnimation from './HeartEffectAnimation';
import StarEffectAnimation from './StarEffectAnimation';
import ExplosionEffectAnimation from './ExplosionEffectAnimation';
import ThunderEffectAnimation from './ThunderEffectAnimation';
import BulletImpactEffect from './BulletImpactEffect';

type Theme = 'arcade' | 'turkey';

export const getEffectsByTheme = (theme: Theme) => {
  if (theme === 'arcade') {
    return [ExplosionEffectAnimation, StarEffectAnimation];
  } else if (theme === 'turkey') {
    return [HeartEffectAnimation, ThunderEffectAnimation, BulletImpactEffect];
  }
  return [];
};
