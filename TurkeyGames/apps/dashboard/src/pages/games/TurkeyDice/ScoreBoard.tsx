import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ScoreBoard.module.css';
import ScoreCard from '../../../components/games/TurkeyDice/ScoreCard';
import logo from '../../../assets/images/logo.png';

interface PlayerData {
  id: number;
  name: string;
  score: number;
  items: {
    name: string;
    completed: boolean;
  }[];
}

// 족보 목록
const handRankings = [
  '에이스', '듀얼', '트리플', '쿼드', 
  '펜타', '헥사', '포커', '풀하우스', 
  'S.S', 'L.S', '터키', '찬스'
];

// 플레이어 데이터
const players: PlayerData[] = [
  {
    id: 1,
    name: '가현',
    score: 270,
    items: handRankings.map(name => ({ name, completed: false }))
  },
  {
    id: 2,
    name: '경록',
    score: 270,
    items: handRankings.map(name => ({ name, completed: false }))
  },
  {
    id: 3,
    name: '웅지',
    score: 270,
    items: handRankings.map(name => ({ name, completed: false }))
  },
  {
    id: 4,
    name: '동현',
    score: 270,
    items: handRankings.map(name => ({ name, completed: false }))
  }
];

const ScoreBoard: React.FC = () => {
    const navigate = useNavigate();

    const handleGameResult = () => {
        navigate('/games/TurkeyDice/result');
      };
    
    const handleHomeButton = () => {
        navigate('/');  
    }

  return (
      <div className={styles.container}>
        <span
            className={styles.logo}
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
            title="홈으로 이동"
            >
            <img src={logo} alt="logo" className={styles.logoImg} />
        </span>
        <h1 className={styles.title}>점수 현황</h1>
        <div className={styles.scoreCardsContainer}>
          {players.map(player => (
            <ScoreCard
              key={player.id}
              playerNumber={player.id}
              playerName={player.name}
              score={player.score}
              items={player.items}
            />
          ))}
        </div>
        <div className={styles.buttonContainer}>
        <button className={styles.resultButton} onClick={handleGameResult}>게임 결과</button>
        </div>
      </div>
  );
};

export default ScoreBoard;
