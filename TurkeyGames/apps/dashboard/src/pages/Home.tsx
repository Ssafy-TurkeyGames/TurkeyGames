// apps/dashboard/src/pages/Home.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import Card from '../components/Card';
import diceIcon from '../assets/images/dice.png';
import foodIcon from '../assets/images/food.png';
import bookIcon from '../assets/images/book.png';
import wifiIcon from '../assets/images/wifi.png';
import playIcon from '../assets/images/play.png';
import messageIcon from '../assets/images/message.png';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.topCards}>
          <Card
            type="big"
            iconSrc={diceIcon}
            iconAlt="주사위 아이콘 "
            title="게임 검색하기"
            subText="BoardGames"
            onClick={() => navigate('/search')}
          />
          <Card
            type="big"
            iconSrc={foodIcon}
            iconAlt="음식 아이콘"
            title="메뉴 주문하기"
            subText="Food & Drink"
          />
        </div>
        <div className={styles.bottomCards}>
          <Card
            type="small"
            iconSrc={bookIcon}
            iconAlt="책 아이콘"
            title="매장 시설 안내"
          />
          <Card
            type="small"
            iconSrc={wifiIcon}
            iconAlt="와이파이 아이콘"
            title="와이파이"
          />
          <Card
            type="small"
            iconSrc={playIcon}
            iconAlt="재생 아이콘"
            title="이용안내 영상"
          />
          <Card
            type="small"
            iconSrc={messageIcon}
            iconAlt="메시지 아이콘"
            title="고객의 소리"
          />
        </div>
      </div>
    </div>
  );
}
