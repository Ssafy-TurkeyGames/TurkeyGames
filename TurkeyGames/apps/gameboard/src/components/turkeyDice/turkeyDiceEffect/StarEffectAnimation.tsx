import React from 'react';
import styles from './StarEffectAnimation.module.css';

interface Props {
  x: number;
  y: number;
}

const StarEffectAnimation: React.FC<Props> = ({ x, y }) => {
  return (
    <div
      className={styles.starEffect}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        pointerEvents: 'none',
      }}
    >
      <img src="/effects/star.png" alt="Star Effect" />
    </div>
  );
};

export default StarEffectAnimation;
