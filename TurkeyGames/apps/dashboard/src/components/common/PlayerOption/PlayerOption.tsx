// apps/dashboard/src/components/common/PlayerOption/PlayerOption.tsx
import React from 'react';
import styles from './PlayerOption.module.css';
import userIcon from '../../../assets/images/user.png'

interface PlayerOptionProps {
    options: number[];
    selected: number | null;
    onSelect: (count: number) => void;
    title?: string;
  }
  
  export default function PlayerOption({ 
    options = [2, 3, 4], 
    selected, 
    onSelect, 
    title = "플레이어 수 선택" 
  }: PlayerOptionProps) {
    return (
      <div className={styles.card}>
        <img src={userIcon} alt="플레이어" className={styles.icon} />
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.buttonGroup}>
          {options.map(count => (
            <button
              key={count}
              className={`${styles.optionButton} ${selected === count ? styles.active : ''}`}
              onClick={() => onSelect(count)}
            >
              {count}인
            </button>
          ))}
        </div>
      </div>
    );
  }