// apps/dashboard/src/pages/games/TurkeyDice/GameResult.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import GameResult from '../../../components/games/GameResult';
import styles from './GameResult.module.css';
import axios from 'axios';

// API 서버 URL
const API_URL = 'http://localhost:8000';

interface PlayerResult {
  id: number;
  name: string;
  score: number;
}

const playerNames = ['가현', '경록', '웅지', '동현'];

const TurkeyDiceResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');
  
  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameResult = async () => {
      try {
        if (!gameId) {
          // 게임 ID가 없는 경우 기본 데이터 사용
          setPlayers([
            { id: 1, name: '가현', score: 0 },
            { id: 2, name: '경록', score: 0 },
            { id: 3, name: '웅지', score: 0 },
            { id: 4, name: '동현', score: 0 }
          ]);
          setLoading(false);
          return;
        }

        // 게임 점수 조회
        const response = await axios.get(`${API_URL}/yacht/${gameId}/scores`);
        console.log('게임 결과 조회 응답:', response.data);
        
        if (response.data && response.data.scores) {
          const formattedPlayers = response.data.scores.map((score: any, index: number) => ({
            id: index + 1,
            name: playerNames[index] || `플레이어 ${index + 1}`,
            score: score.total_score || 0
          }));
          
          // 점수 기준 내림차순 정렬
          formattedPlayers.sort((a, b) => b.score - a.score);
          
          setPlayers(formattedPlayers);
        }
      } catch (error) {
        console.error('게임 결과 조회 오류:', error);
        // 오류 발생 시 기본 데이터 사용
        setPlayers([
          { id: 1, name: '가현', score: 0 },
          { id: 2, name: '경록', score: 0 },
          { id: 3, name: '웅지', score: 0 },
          { id: 4, name: '동현', score: 0 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchGameResult();
  }, [gameId]);

  if (loading) {
    return <div className={styles.loading}>게임 결과를 불러오는 중...</div>;
  }

  return (
    <div className={styles.container}>
      <GameResult 
        players={players} 
        gameId={gameId || 'TurkeyDice'} 
      />
    </div>
  );
};

export default TurkeyDiceResult;
