// apps/dashboard/src/components/Header.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '../assets/images/logo.png';
import soundOnIcon from '../assets/images/sound-on.png'; // 소리 켜기 아이콘
import soundOffIcon from '../assets/images/sound-off.png'; // 소리 끄기 아이콘

interface HeaderProps {
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isSoundOn, setIsSoundOn] = useState(true);

  const toggleSound = () => {
    setIsSoundOn(!isSoundOn);
    // 실제 소리 켜고 끄는 로직 추가
  };

  return (
    <header className={styles.header}>
      <span
        className={styles.logo}
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
        title="홈으로 이동"
      >
        <img src={logo} alt="logo" className={styles.logoImg} />
      </span>
      {children && <div className={styles.headerCenter}>{children}</div>}
      <div className={styles.soundToggleContainer}>
        <img 
          src={isSoundOn ? soundOnIcon : soundOffIcon} 
          alt={isSoundOn ? "소리 켜짐" : "소리 꺼짐"} 
          className={styles.soundIcon}
        />
        <label className={styles.toggleSwitch}>
          <input 
            type="checkbox" 
            checked={isSoundOn} 
            onChange={toggleSound}
          />
          <span className={styles.slider}></span>
        </label>
      </div>
    </header>
  );
};

export default Header;