// apps/dashboard/src/components/Card/Card.tsx
import React from 'react';
import styles from './Card.module.css';

type CardType = 'big' | 'small';

interface CardProps {
  type: CardType;
  iconSrc: string;
  iconAlt: string;
  title: string;
  subText?: string; // ex: BoardGames, Food & Drink
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  type,
  iconSrc,
  iconAlt,
  title,
  subText,
  onClick,
}) => {
  return (
    <button
      type="button"
      className={type === 'big' ? styles.bigCard : styles.smallCard}
      onClick={onClick}
    >
      {type === 'big' ? (
        <>
          <span className={styles.bigTitle}>{title}</span>
          {subText && <span className={styles.bigSub}>{subText}</span>}
          <img src={iconSrc} alt={iconAlt} className={styles.bigIcon} />
        </>
      ) : (
        <>
          <img src={iconSrc} alt={iconAlt} className={styles.smallIcon} />
          <span className={styles.smallTitle}>{title}</span>
        </>
      )}
    </button>
  );
};

export default Card;
