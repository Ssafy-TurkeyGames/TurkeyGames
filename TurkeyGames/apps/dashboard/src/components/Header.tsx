import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '../assets/images/logo.png';
import soundOnIcon from '../assets/images/sound-on.png';
import soundOffIcon from '../assets/images/sound-off.png';
import { getSoundEnabled, setSoundEnabled, onSoundSettingChange } from '../utils/soundUtils';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isSoundOn, setIsSoundOn] = useState(getSoundEnabled());

  useEffect(() => {
    return onSoundSettingChange(setIsSoundOn);
  }, []);

  const toggleSound = () => {
    setSoundEnabled(!isSoundOn);
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

export default React.memo(Header);
