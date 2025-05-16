// gameboard/components/turkeyDice/turkeyDiceEffect/EffectTrigger.tsx
import React, { useEffect } from 'react';
import { getEffectsByTheme } from './EffectSelector';
import { createRoot } from 'react-dom/client';

interface EffectTriggerProps {
  theme: 'arcade' | 'turkey';
  positions: { x: number; y: number }[];
}

const EffectTrigger: React.FC<EffectTriggerProps> = ({ theme, positions }) => {
  const effects = getEffectsByTheme(theme);

  useEffect(() => {
    positions.forEach((pos, i) => {
      const Effect = effects[i % effects.length];
      const wrapper = document.createElement('div');
      wrapper.style.position = 'absolute';
      wrapper.style.left = `${pos.x}px`;
      wrapper.style.top = `${pos.y}px`;
      wrapper.style.pointerEvents = 'none';
      document.body.appendChild(wrapper);

      const root = createRoot(wrapper);
      root.render(<Effect x={pos.x} y={pos.y} />);

      setTimeout(() => {
        wrapper.remove();
      }, 1500);
    });
  }, [theme, positions]);

  return null;
};

export default EffectTrigger;
