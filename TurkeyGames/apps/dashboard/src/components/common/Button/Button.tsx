// components/common/Button/Button.tsx
import React from 'react';
import styles from './Button.module.css';

export default function Button({ children, active, ...props }) {
  return (
    <button
      className={`${styles.btn} ${active ? styles.active : ''}`}
      {...props}
    >
      {children}
    </button>
  );
}