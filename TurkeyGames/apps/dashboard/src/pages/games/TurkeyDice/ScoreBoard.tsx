// pages/games/TurkeyDice/ScoreBoard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './ScoreBoard.module.css';
import ScoreCard from '../../../components/games/TurkeyDice/ScoreCard';
import Logo from '../../../components/common/Logo';
import axios from 'axios';
import { useSocket } from '../../../hooks/useSocket';

// API 서버 URL
const API_URL = 'http://192.168.30.158:8000';

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

// 족보 이름 매핑
const scorecardMapping = [
  { apiName: 'ace', displayName: '에이스' },
  { apiName: 'dual', displayName: '듀얼' },
  { apiName: 'triple', displayName: '트리플' },
  { apiName: 'quad', displayName: '쿼드' },
  { apiName: 'penta', displayName: '펜타' },
  { apiName: 'hexa', displayName: '헥사' },
  { apiName: 'poker', displayName: '포커' },
  { apiName: 'full_house', displayName: '풀하우스' },
  { apiName: 'small_straight', displayName: 'S.S' },
  { apiName: 'large_straight', displayName: 'L.S' },
  { apiName: 'turkey', displayName: '터키' },
  { apiName: 'chance', displayName: '찬스' }
];

// 기본 플레이어 데이터
const defaultPlayers: PlayerData[] = [
  {
    id: 1,
    name: '가현',
    score: 0,
    items: scorecardMapping.map(({ displayName }) => ({ name: displayName, score: 0, completed: false }))
  },
  {
    id: 2,
    name: '경록',
    score: 0,
    items: scorecardMapping.map(({ displayName }) => ({ name: displayName, score: 0, completed: false }))
  },
  {
    id: 3,
    name: '웅지',
    score: 0,
    items: scorecardMapping.map(({ displayName }) => ({ name: displayName, score: 0, completed: false }))
  },
  {
    id: 4,
    name: '동현',
    score: 0,
    items: scorecardMapping.map(({ displayName }) => ({ name: displayName, score: 0, completed: false }))
  }
];

const playerNames = ['가현', '경록', '웅지', '동현'];

const ScoreBoard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');
  const { socket, isConnected } = useSocket();
  
  const [players, setPlayers] = useState<PlayerData[]>(defaultPlayers);
  const [loading, setLoading] = useState(true);
  const [gameStatus, setGameStatus] = useState<string>('waiting');
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // 초기 데이터 로딩
  useEffect(() => {
    if (!gameId || initialDataLoaded) return;

    const fetchInitialData = async () => {
      try {
        // 게임 상태 조회
        const statusResponse = await axios.get(`${API_URL}/yacht/${gameId}/status`);
        console.log('게임 상태 조회 응답:', statusResponse.data);
        
        if (statusResponse.data && statusResponse.data.status) {
          const newStatus = statusResponse.data.status;
          setGameStatus(newStatus);
          
          // 게임이 종료되면 결과 화면으로 이동
          if (newStatus === 'ended') {
            navigate(`/games/TurkeyDice/result?gameId=${gameId}`);
            return;
          }
        }
        
        // 게임 점수 조회
        const scoresResponse = await axios.get(`${API_URL}/yacht/${gameId}/scores`);
        console.log('게임 점수 조회 응답:', scoresResponse.data);
        
        if (scoresResponse.data && scoresResponse.data.scores) {
          const formattedPlayers = formatPlayerData(scoresResponse.data.scores);
          setPlayers(formattedPlayers);
        }
        
        setInitialDataLoaded(true);
      } catch (error) {
        console.error('게임 데이터 조회 오류:', error);
        
        // 게임이 종료되어 데이터를 조회할 수 없는 경우 결과 화면으로 이동
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          navigate(`/games/TurkeyDice/result?gameId=${gameId}`);
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [gameId, navigate, initialDataLoaded]);

  // 웹소켓 이벤트 리스너
  useEffect(() => {
    if (!socket || !isConnected || !gameId) return;

    // 게임 상태 변경 이벤트
    socket.on('game_status', (data) => {
      console.log('게임 상태 변경:', data);
      if (data.status) {
        setGameStatus(data.status);
        
        // 게임이 종료되면 결과 화면으로 이동
        if (data.status === 'ended') {
          navigate(`/games/TurkeyDice/result?gameId=${gameId}`);
        }
      }
    });

    // 점수 업데이트 이벤트
    socket.on('score_update', (data) => {
      console.log('점수 업데이트:', data);
      if (data.scores) {
        const formattedPlayers = formatPlayerData(data.scores);
        setPlayers(formattedPlayers);
      }
    });

    // 게임 종료 이벤트
    socket.on('game_ended', (data) => {
      console.log('게임 종료:', data);
      navigate(`/games/TurkeyDice/result?gameId=${gameId}`);
    });

    // 게임 참가
    socket.emit('join_game', { gameId });

    return () => {
      socket.off('game_status');
      socket.off('score_update');
      socket.off('game_ended');
    };
  }, [socket, isConnected, gameId, navigate]);

  // 플레이어 데이터 포맷 함수
  const formatPlayerData = (scoresData: any[]) => {
    return scoresData.map((scoreData: any, index: number) => {
      const scorecard = scoreData.scorecard || {};
      
      // 족보 항목 생성
      const items = scorecardMapping.map(({ apiName, displayName }) => {
        // API 응답에서 해당 족보의 점수 가져오기
        const value = scorecard[apiName];
        
        // 요트다이스 룰: 기록된 점수는 해당 점수로 표시, 기록되지 않은 항목은 0으로 표시
        return {
          name: displayName,
          score: value !== undefined ? value : 0, // 기록된 점수 표시
          completed: value !== undefined && value !== 0 // 점수가 기록된 경우에만 completed
        };
      });
      
      return {
        id: index + 1,
        name: playerNames[index] || `플레이어 ${index + 1}`,
        score: scoreData.total_score || 0,
        items
      };
    });
  };

  // 게임 결과 버튼 클릭 처리 (단순히 결과 화면으로 이동)
  const handleGameResult = () => {
    navigate(`/games/TurkeyDice/result${gameId ? `?gameId=${gameId}` : ''}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>게임 데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Logo 
          size="medium" 
          className={styles.logo}
          onClick={() => navigate('/')}
        />
      </div>
      
      <h1 className={styles.title}>점수 현황</h1>
      
      <div className={styles.scoreCardsContainer}>
        {players.map((player) => (
          <ScoreCard
            key={player.id}
            playerNumber={player.id}
            playerName={player.name}
            score={player.score}
            items={player.items}
            isFirst={player.id === 1}
          />
        ))}
      </div>
      
      <div className={styles.buttonContainer}>
        <button className={styles.resultButton} onClick={handleGameResult}>
          게임 결과
        </button>
      </div>
      
      {gameId && (
        <div className={styles.gameIdBadge}>
          게임 ID: {gameId} | 상태: {gameStatus} | 연결: {isConnected ? '연결됨' : '연결 중...'}
        </div>
      )}
    </div>
  );
};

export default ScoreBoard;
