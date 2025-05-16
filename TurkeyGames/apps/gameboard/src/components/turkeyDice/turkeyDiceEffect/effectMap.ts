// effectMap.ts

import BulletImpactEffect from './BulletImpactEffect';
import ExplosionEffectAnimation from './ExplosionEffectAnimation';
import HeartEffectAnimation from './HeartEffectAnimation';
import StarEffectAnimation from './StarEffectAnimation';
import ThunderEffectAnimation from './ThunderEffectAnimation';

export type GameMode = 'turkey' | 'arcade';

export const effectMap: Record<GameMode, React.ComponentType[]> = {
  turkey: [HeartEffectAnimation, ThunderEffectAnimation],
  arcade: [BulletImpactEffect, ExplosionEffectAnimation],
};
