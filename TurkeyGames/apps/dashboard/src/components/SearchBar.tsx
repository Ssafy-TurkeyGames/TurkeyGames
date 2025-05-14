// apps/dashboard/src/components/SearchBar.tsx
import React from 'react';
import styles from './SearchBar.module.css';
import searchIcon from '../assets/images/search (1).png';

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: () => void; // 필수 prop
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange,
  onSearch, 
  placeholder 
}) => (
  <div className={styles.searchBar}>
    <input
      className={styles.input}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder || '게임을 검색해보세요'}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSearch) { // onSearch가 있을 때만 실행
          e.preventDefault(); // 폼 제출 방지
          onSearch();
        }
      }}
      />
      <button 
        type="button" 
        className={styles.iconBtn} 
        onClick={onSearch} // onSearch가 있을 때만 연결
        aria-label="검색" 
        disabled={!onSearch} // onSearch가 없으면 버튼 비활성화
      >
        <img src={searchIcon} alt="검색" className={styles.icon} />
      </button>
    </div>
  );

export default SearchBar;
