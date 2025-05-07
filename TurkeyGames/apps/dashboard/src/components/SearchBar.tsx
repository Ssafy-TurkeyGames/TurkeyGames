// apps/dashboard/src/components/SearchBar.tsx
import React from 'react';
import styles from './SearchBar.module.css';
import searchIcon from '../assets/images/search (1).png';

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder }) => (
  <div className={styles.searchBar}>
    <input
      className={styles.input}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder || '게임을 검색해보세요'}
    />
    <img src={searchIcon} alt="검색" className={styles.icon} />
  </div>
);

export default SearchBar;
