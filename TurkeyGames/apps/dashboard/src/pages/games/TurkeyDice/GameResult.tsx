// dashboard/src/pages/games/TurkeyDice/GameResult.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import GameResult from '../../../components/games/GameResult';
import styles from './GameResult.module.css';
import { useSocket } from '../../../hooks/useSocket';

// API 서버 URL
const SOCKET_SERVER_URL = 'http://localhost:8000';

interface PlayerScore {
  player_id: number;
  scorecard: Record<string, number>;
  total_score: number;
}

interface PlayerResult {
  id: number;
  name: string;
  score: number;
  rank?: number;
}

const TurkeyDiceResult: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const gameId = searchParams.get('gameId');
  const { socket, isConnected } = useSocket();
  
  // location.state에서 전달받은 점수 데이터 확인
  const scoreDataFromState = location.state?.scoreData;
  
  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 기본 플레이어 데이터 생성 (게임 데이터를 가져오지 못할 경우 사용)
  const createDefaultPlayers = (count: number = 4): PlayerResult[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `PLAYER ${i + 1}`,
      score: 0
    }));
  };

  useEffect(() => {
    // 이전 화면에서 전달받은 점수 데이터가 있으면 사용
    if (scoreDataFromState) {
      console.log('[TurkeyDiceResult] 이전 화면에서 전달받은 점수 데이터 사용:', scoreDataFromState);
      
      // 점수 데이터 변환 (필요한 경우)
      const formattedPlayers = scoreDataFromState.map((player: any) => ({
        id: player.id,
        name: player.name,
        score: player.score
      }));
      
      setPlayers(formattedPlayers);
      setLoading(false);
      return;
    }

    if (!gameId) {
      setError('게임 ID가 없습니다.');
      setLoading(false);
      return;
    }

    const fetchGameResults = async () => {
      try {
        console.log('[TurkeyDiceResult] 게임 결과 데이터 로딩 시작, gameId:', gameId);
        
        // 게임 점수 조회
        const scoresResponse = await axios.get(`${SOCKET_SERVER_URL}/yacht/${gameId}/scores`);
        console.log('[TurkeyDiceResult] 게임 점수 조회 응답:', scoresResponse.data);
        
        if (scoresResponse.data && scoresResponse.data.scores) {
          const formattedPlayers = formatPlayerResults(scoresResponse.data.scores);
          setPlayers(formattedPlayers);
        } else {
          // 점수 데이터가 없으면 기본 플레이어 데이터 사용
          console.log('[TurkeyDiceResult] 점수 데이터가 없어 기본 데이터 사용');
          setPlayers(createDefaultPlayers());
        }
      } catch (error) {
        console.error('[TurkeyDiceResult] 게임 결과 데이터 조회 오류:', error);
        
        // 오류 세부 정보 로깅
        if (error.response) {
          console.error('- 상태 코드:', error.response.status);
          console.error('- 응답 데이터:', error.response.data);
        }
        
        // 404 오류인 경우 게임이 종료되었거나 존재하지 않는 경우
        if (error.response?.status === 404) {
          console.log('[TurkeyDiceResult] 게임을 찾을 수 없음 (404), 기본 데이터 사용');
          setPlayers(createDefaultPlayers());
        } else {
          setError('게임 결과를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGameResults();
    
    // 소켓 이벤트 리스너 설정
    if (socket && isConnected && gameId) {
      console.log('[TurkeyDiceResult] 웹소켓 이벤트 리스너 등록, 연결 상태:', isConnected);
      
      // 점수 업데이트 이벤트
      socket.on('score_update', (data) => {
        console.log('[TurkeyDiceResult] 점수 업데이트 이벤트:', data);
        if (data.scores) {
          const formattedPlayers = formatPlayerResults(data.scores);
          setPlayers(formattedPlayers);
        }
      });
      
      // end_game 이벤트 리스너
      socket.on('end_game', (data) => {
        console.log('[TurkeyDiceResult] end_game 이벤트 수신:', data);
        // 이미 결과 화면에 있으므로 추가 작업은 필요 없음
        if (data.scores) {
          const formattedPlayers = formatPlayerResults(data.scores);
          setPlayers(formattedPlayers);
        }
      });
      
      // 게임 참가
      socket.emit('join_game', { gameId });
      console.log('[TurkeyDiceResult] 게임 참가 이벤트 발송, gameId:', gameId);
      
      return () => {
        console.log('[TurkeyDiceResult] 웹소켓 이벤트 리스너 정리');
        socket.off('score_update');
        socket.off('end_game');
        
        // 게임 퇴장
        socket.emit('leave_game', { gameId });
        console.log('[TurkeyDiceResult] 게임 퇴장 이벤트 발송, gameId:', gameId);
      };
    }
  }, [gameId, socket, isConnected, scoreDataFromState]);

  // 플레이어 결과 데이터 포맷 함수
  const formatPlayerResults = (scoresData: PlayerScore[]): PlayerResult[] => {
    // 점수 데이터를 total_score 기준으로 내림차순 정렬
    const sortedScores = [...scoresData].sort((a, b) => b.total_score - a.total_score);
    
    return sortedScores.map((scoreData, index) => {
      // 순위 계산 (동점자 처리)
      let rank = index + 1;
      if (index > 0 && scoreData.total_score === sortedScores[index - 1].total_score) {
        rank = index; // 동점자는 같은 순위
      }
      
      return {
        id: scoreData.player_id,
        name: `PLAYER ${scoreData.player_id}`,
        score: scoreData.total_score || 0,
        rank
      };
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingMessage}>게임 결과를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>{error}</div>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/')}
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return <GameResult players={players} gameId={gameId || ''} />;
};

export default TurkeyDiceResult;
