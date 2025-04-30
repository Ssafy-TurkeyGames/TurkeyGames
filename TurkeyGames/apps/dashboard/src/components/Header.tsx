// apps/dashboard/src/components/Header/Header.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '../assets/images/logo.png';

const Header = ({ children }: { children?: React.ReactNode }) => {
  const navigate = useNavigate();

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
      {/* children이 있으면(검색창 등) 가운데 렌더 */}
      {children && <div className={styles.headerCenter}>{children}</div>}
      <span className={styles.langButton}>💰 KO ▼</span>
    </header>
  );
};

export default Header;
