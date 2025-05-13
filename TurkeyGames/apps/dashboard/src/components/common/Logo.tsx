// components/common/Logo.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Logo.module.css';
import logo from '../../assets/images/logo.png';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  onClick, 
  className = '' 
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/');
    }
  };
  
  return (
    <div 
      className={`${styles.logoContainer} ${styles[size]} ${className}`}
      onClick={handleClick}
    >
      <img 
        src={logo} 
        alt="Turkey Games Logo" 
        className={styles.logoImage}
        draggable="false"
        tabIndex={-1}
      />
    </div>
  );
};

export default Logo;
