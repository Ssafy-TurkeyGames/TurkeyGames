// pages/games/TurkeyDice/ScoreBoard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ScoreBoard.module.css';
import ScoreCard from '../../../components/games/TurkeyDice/ScoreCard';
import turkeyLogo from '../../../assets/images/logo.png';

interface ScoreItem {
  name: string;
  score: number;
  completed: boolean;
}

interface PlayerData {
  id: number;
  name: string;
  score: number;
  items: ScoreItem[];
}

// 족보 목록과 점수
const handRankings = [
  { name: '에이스', score: 35 },
  { name: '듀얼', score: 25 },
  { name: '트리플', score: 30 },
  { name: '쿼드', score: 40 },
  { name: '펜타', score: 50 },
  { name: '헥사', score: 60 },
  { name: '포커', score: 40 },
  { name: '풀하우스', score: 35 },
  { name: 'S.S', score: 15 },
  { name: 'L.S', score: 30 },
  { name: '터키', score: 50 },
  { name: '찬스', score: 0 }
];

// 플레이어 데이터
const players: PlayerData[] = [
  {
    id: 1,
    name: '가현',
    score: 270,
    items: handRankings.map(({ name, score }) => ({ name, score, completed: false }))
  },
  {
    id: 2,
    name: '경록',
    score: 270,
    items: handRankings.map(({ name, score }) => ({ name, score, completed: false }))
  },
  {
    id: 3,
    name: '웅지',
    score: 270,
    items: handRankings.map(({ name, score }) => ({ name, score, completed: false }))
  },
  {
    id: 4,
    name: '동현',
    score: 270,
    items: handRankings.map(({ name, score }) => ({ name, score, completed: false }))
  }
];

const ScoreBoard: React.FC = () => {
  const navigate = useNavigate();

  const handleGameResult = () => {
    navigate('/games/TurkeyDice/result');
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <img 
          src={turkeyLogo} 
          alt="Turkey Games" 
          className={styles.logo} 
          onClick={() => navigate('/')}
          draggable="false"
          tabIndex="-1" /* 포커스 방지 */
        />
      </div>
      
      <h1 className={styles.title}>점수 현황</h1>
      
      <div className={styles.scoreCardsContainer}>
        {players.map((player, index) => (
          <ScoreCard
            key={player.id}
            playerNumber={player.id}
            playerName={player.name}
            score={player.score}
            items={player.items}
            isFirst={player.id === 1} // 1번 플레이어는 1등으로 강조
          />
        ))}
      </div>
      
      <div className={styles.buttonContainer}>
        <button className={styles.resultButton} onClick={handleGameResult}>
          게임 결과
        </button>
      </div>
    </div>
  );
};

export default ScoreBoard;
