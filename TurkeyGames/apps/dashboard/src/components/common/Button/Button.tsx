// components/common/Button/Button.tsx
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  active?: boolean;
  variant?: 'primary' | 'outline' | 'default';
  className?: string;
}

export default function Button({ 
  children, 
  active = false, 
  variant = 'default',
  className = '', 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`${styles.btn} ${active ? styles.active : ''} ${styles[variant] || ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
