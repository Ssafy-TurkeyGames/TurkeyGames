// pages/games/TurkeyDice/ScoreBoard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import styles from './ScoreBoard.module.css';
import ScoreCard from '../../../components/games/TurkeyDice/ScoreCard';
import Logo from '../../../components/common/Logo';
import axios from 'axios';
import { useSocket } from '../../../hooks/useSocket';
import { endYachtGame } from '../../../api/dashboardApi';
import Rule from '../../../pages/Rule';
// import axiosInstance from '../../../api/axiosInstance';

// 소켓 서버 URL
const SOCKET_SERVER_URL = 'http://localhost:8000';

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
  { apiName: 'chance', displayName: '찬스' },
  { apiName: 'poker', displayName: '포커' },
  { apiName: 'full_house', displayName: '풀하우스' },
  { apiName: 'small_straight', displayName: 'S.S' },
  { apiName: 'large_straight', displayName: 'L.S' },
  { apiName: 'turkey', displayName: '터키' }
];

// 기본 플레이어 데이터 - 동적 이름 생성
const defaultPlayers: PlayerData[] = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  name: `PLAYER ${i + 1}`, // 하드코딩된 이름 대신 동적 생성
  score: 0,
  items: scorecardMapping.map(({ displayName }) => ({ name: displayName, score: 0, completed: false }))
}));

const ScoreBoard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');
  const { socket, isConnected } = useSocket();
  
  const [players, setPlayers] = useState<PlayerData[]>(defaultPlayers);
  const [loading, setLoading] = useState(true);
  const [gameStatus, setGameStatus] = useState<string>('waiting');
  const [endingGame, setEndingGame] = useState(false); // 게임 종료 상태 추가
  const [showRuleModal, setShowRuleModal] = useState(false); // 규칙 모달 표시 상태

  const TURKEY_DICE_GAME_ID = "1";

  // 초기 데이터 로딩
  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    const fetchGameData = async () => {
      try {
        console.log('[ScoreBoard] 게임 데이터 초기 로딩 시작, gameId:', gameId);
        
        // 게임 상태 조회 - 소켓 서버 URL 사용
        const statusResponse = await axios.get(`${SOCKET_SERVER_URL}/yacht/${gameId}/status`);
        console.log('[ScoreBoard] 게임 상태 조회 응답:', statusResponse.data);
        
        if (statusResponse.data && statusResponse.data.status) {
          const newStatus = statusResponse.data.status;
          setGameStatus(newStatus);
          
          // 게임이 종료되면 결과 화면으로 이동
          if (newStatus === 'ended') {
            console.log('[ScoreBoard] 게임이 이미 종료됨, 결과 화면으로 이동');
            navigate(`/games/TurkeyDice/result/${gameId}`);
            return;
          }
        }
        
        // 게임 점수 조회 - 소켓 서버 URL 사용
        const scoresResponse = await axios.get(`${SOCKET_SERVER_URL}/yacht/${gameId}/scores`);
        console.log('[ScoreBoard] 게임 점수 조회 응답:', scoresResponse.data);
        
        if (scoresResponse.data && scoresResponse.data.scores) {
          const formattedPlayers = formatPlayerData(scoresResponse.data.scores);
          setPlayers(formattedPlayers);
        }
      } catch (error) {
        console.error('[ScoreBoard] 게임 데이터 조회 오류:', error);
        
        // axios 오류 세부 정보 로깅
        if (error.response) {
          console.error('- 상태 코드:', error.response.status);
          console.error('- 응답 데이터:', error.response.data);
        }
        
        // 게임이 종료되어 데이터를 조회할 수 없는 경우 결과 화면으로 이동
        if (error.response?.status === 404) {
          console.log('[ScoreBoard] 게임을 찾을 수 없음 (404)');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, navigate]);

  // 웹소켓 이벤트 리스너
  useEffect(() => {
  if (!socket || !isConnected || !gameId) {
    console.log('❌ [대시보드] 소켓 연결 없음 또는 게임 ID 없음:', { 
      socketExists: !!socket, 
      isConnected, 
      gameId 
    });
    return;
  }

  console.log('🔄 [대시보드] 웹소켓 이벤트 리스너 등록, 연결 상태:', isConnected, '소켓 ID:', socket.id);

  // 게임 상태 변경 이벤트
  socket.on('game_status', (data) => {
    console.log('ℹ️ [대시보드] 게임 상태 변경 이벤트:', data);
    if (data.status) {
      setGameStatus(data.status);
      
      // 게임이 종료되면 결과 화면으로 이동
      if (data.status === 'ended') {
        console.log('✅ [대시보드] 게임 종료 상태 감지, 결과 화면으로 이동');
        navigate(`/games/TurkeyDice/result/${gameId}`);
      }
    }
  });

  // 점수 업데이트 이벤트
  socket.on('score_update', (data) => {
    console.log('ℹ️ [대시보드] 점수 업데이트 이벤트:', data);
    if (data.scores) {
      const formattedPlayers = formatPlayerData(data.scores);
      setPlayers(formattedPlayers);
    }
  });

  // end_game 이벤트 리스너
  socket.on('end_game', (data) => {
    console.log('✅ [대시보드] end_game 이벤트 수신:', data);
    
    // 점수 데이터가 있으면 사용하여 새로운 플레이어 데이터 생성
    let updatedPlayers = players;
    
    // 서버에서 받은 최신 점수 데이터가 있으면 사용
    if (data.scores) {
      updatedPlayers = formatPlayerData(data.scores);
    } else {
      // 최신 점수 데이터를 가져오기 위한 API 호출
      axios.get(`${SOCKET_SERVER_URL}/yacht/${gameId}/scores`)
        .then(response => {
          if (response.data && response.data.scores) {
            const latestPlayers = formatPlayerData(response.data.scores);
            // 결과 화면으로 이동 (최신 점수 데이터 전달)
            navigate(`/games/TurkeyDice/result/${gameId}`, {
              state: { scoreData: latestPlayers }
            });
          }
        })
        .catch(error => {
          console.error('[ScoreBoard] 최종 점수 조회 오류:', error);
          // 오류 발생 시 현재 상태의 플레이어 데이터 사용
          navigate(`/games/TurkeyDice/result/${gameId}`, {
            state: { scoreData: players }
          });
        });
      return; // API 호출 후 함수 종료
    }
    
    // 결과 화면으로 이동 (최신 점수 데이터 전달)
    navigate(`/games/TurkeyDice/result/${gameId}`, {
      state: { scoreData: updatedPlayers }
    });
  });

  // 모든 이벤트 로깅 (디버깅용)
  socket.onAny((event, ...args) => {
    console.log(`🔍 [대시보드] 소켓 이벤트 수신: ${event}`, args);
  });

  // 게임 참가
  socket.emit('join_game', { gameId });
  console.log('🔄 [대시보드] 게임 참가 이벤트 발송, gameId:', gameId);

  return () => {
    console.log('🔄 [대시보드] 웹소켓 이벤트 리스너 정리');
    socket.off('game_status');
    socket.off('score_update');
    socket.off('end_game');
    socket.offAny(); // 모든 이벤트 리스너 제거
  };
}, [socket, isConnected, gameId, navigate, players]);


  // 플레이어 데이터 포맷 함수
const formatPlayerData = (scoresData: any[]) => {
  // 점수 데이터를 total_score 기준으로 내림차순 정렬
  const sortedScores = [...scoresData].sort((a, b) => b.total_score - a.total_score);
  
  return sortedScores.map((scoreData: any, index: number) => {
    const scorecard = scoreData.scorecard || {};
    
    // 족보 항목 생성
    const items = scorecardMapping.map(({ apiName, displayName }) => {
      // API 응답에서 해당 족보의 점수 가져오기
      const value = scorecard[apiName];
      
      // 요트다이스 룰: 기록된 점수는 해당 점수로 표시, 기록되지 않은 항목은 0으로 표시
      return {
        name: displayName, // 수정: 플레이어 이름이 아닌 족보 이름(displayName) 사용
        score: value !== undefined ? value : 0, // 기록된 점수 표시
        completed: value !== undefined && value !== 0 // 점수가 기록된 경우에만 completed
      };
    });
    
    return {
      id: index + 1, // 순위에 따른 ID 할당 (1부터 시작)
      name: `PLAYER ${scoreData.player_id}`, // 플레이어 ID를 사용하여 이름 생성
      score: scoreData.total_score || 0,
      items
    };
  });
};

  // 게임 결과 버튼 클릭 처리
const handleGameResult = async () => {
  // 최신 점수 데이터 가져오기 시도
  if (gameId) {
    try {
      const scoresResponse = await axios.get(`${SOCKET_SERVER_URL}/yacht/${gameId}/scores`);
      if (scoresResponse.data && scoresResponse.data.scores) {
        const latestPlayers = formatPlayerData(scoresResponse.data.scores);
        navigate(`/games/TurkeyDice/result/${gameId}`, {
          state: { scoreData: latestPlayers }
        });
        return;
      }
    } catch (error) {
      console.error('[ScoreBoard] 최종 점수 조회 오류:', error);
    }
  }
  
  // API 호출 실패 시 현재 상태의 플레이어 데이터 사용
  navigate(`/games/TurkeyDice/result/${gameId}`, {
    state: { scoreData: players }
  });
};

// 게임 종료 버튼 클릭 처리
const handleEndGame = async () => {
  if (!gameId) {
    console.warn('[ScoreBoard] 게임 ID가 없어 종료할 수 없습니다.');
    return;
  }
  
  if (!window.confirm('정말 게임을 종료하시겠습니까?')) return;
  
  setEndingGame(true);
  console.log('[ScoreBoard] 게임 종료 시작, gameId:', gameId);
  
  try {
    // 최신 점수 데이터 가져오기
    const scoresResponse = await axios.get(`${SOCKET_SERVER_URL}/yacht/${gameId}/scores`);
    let latestPlayers = players;
    
    if (scoresResponse.data && scoresResponse.data.scores) {
      latestPlayers = formatPlayerData(scoresResponse.data.scores);
    }
    
    // 게임 종료 API 호출
    console.log('[ScoreBoard] 게임 종료 API 호출, gameId:', gameId);
    const response = await axios.post(`${SOCKET_SERVER_URL}/yacht/end/${gameId}`);
    console.log('[ScoreBoard] 게임 종료 API 응답:', response.data);
    
    // 게임 종료 성공 시 결과 화면으로 이동 (최신 점수 데이터 전달)
    if (response.data && response.data.success) {
      // alert('게임이 종료되었습니다.');
      navigate(`/games/TurkeyDice/result/${gameId}`, {
        state: { scoreData: latestPlayers }
      });
    } else {
      alert('게임 종료에 실패했습니다.');
    }
  } catch (error) {
    console.error('[ScoreBoard] 게임 종료 API 호출 오류:', error);
    
    // 오류 세부 정보 로깅
    if (error.response) {
      console.error('- 상태 코드:', error.response.status);
      console.error('- 응답 데이터:', error.response.data);
      console.error('- 요청 URL:', error.config?.url);
    }
    
    // 오류가 발생해도 현재 점수 데이터로 결과 화면으로 이동
    // alert('게임 종료 중 오류가 발생했지만, 결과 화면으로 이동합니다.');
    navigate(`/games/TurkeyDice/result/${gameId}`, {
      state: { scoreData: players }
    });
  } finally {
    setEndingGame(false);
  }
};


  // 규칙 보기 버튼 클릭 처리
  const handleShowRules = () => {
    setShowRuleModal(true);
  };

  // 규칙 모달 닫기 처리
  const handleCloseRuleModal = () => {
    setShowRuleModal(false);
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
        <button 
          className={styles.endGameButton} 
          onClick={handleEndGame}
          disabled={endingGame}
        >
          {endingGame ? '게임 종료 중...' : '게임 종료'}
        </button>
        <button className={styles.resultButton} onClick={handleGameResult}>
          게임 결과
        </button>
        <button className={styles.rulesButton} onClick={handleShowRules}>
          📖 규칙 보기
        </button>
      </div>
      
      {gameId && (
        <div className={styles.gameIdBadge}>
          게임 ID: {gameId} | 상태: {gameStatus} | 연결: {isConnected ? '연결됨' : '연결 중...'}
        </div>
      )}

      {/* 규칙 모달 - onClose 함수 전달 */}
      {showRuleModal && (
        <div className={styles.modalOverlay} onClick={handleCloseRuleModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Rule 
              isModal={true} 
              modalGameId={TURKEY_DICE_GAME_ID} 
              onClose={handleCloseRuleModal}
              showButtons={false} // 버튼 표시 비활성화
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreBoard;