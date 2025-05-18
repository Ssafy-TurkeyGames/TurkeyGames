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
            navigate(`/games/TurkeyDice/result?gameId=${gameId}`);
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
    if (!socket || !isConnected || !gameId) return;

    console.log('[ScoreBoard] 웹소켓 이벤트 리스너 등록, 연결 상태:', isConnected);

    // 게임 상태 변경 이벤트
    socket.on('game_status', (data) => {
      console.log('[ScoreBoard] 게임 상태 변경 이벤트:', data);
      if (data.status) {
        setGameStatus(data.status);
        
        // 게임이 종료되면 결과 화면으로 이동
        if (data.status === 'ended') {
          console.log('[ScoreBoard] 게임 종료 상태 감지, 결과 화면으로 이동');
          navigate(`/games/TurkeyDice/result?gameId=${gameId}`);
        }
      }
    });

    // 점수 업데이트 이벤트
    socket.on('score_update', (data) => {
      console.log('[ScoreBoard] 점수 업데이트 이벤트:', data);
      if (data.scores) {
        const formattedPlayers = formatPlayerData(data.scores);
        setPlayers(formattedPlayers);
      }
    });

    // 게임 종료 이벤트
    socket.on('game_ended', (data) => {
      console.log('[ScoreBoard] 게임 종료 이벤트:', data);
      navigate(`/games/TurkeyDice/result?gameId=${gameId}`);
    });

    // 게임 참가
    socket.emit('join_game', { gameId });
    console.log('[ScoreBoard] 게임 참가 이벤트 발송, gameId:', gameId);

    return () => {
      console.log('[ScoreBoard] 웹소켓 이벤트 리스너 정리');
      socket.off('game_status');
      socket.off('score_update');
      socket.off('game_ended');
      
      // 게임 퇴장
      socket.emit('leave_game', { gameId });
      console.log('[ScoreBoard] 게임 퇴장 이벤트 발송, gameId:', gameId);
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

  // 게임 결과 버튼 클릭 처리
  const handleGameResult = () => {
    navigate(`/games/TurkeyDice/result${gameId ? `?gameId=${gameId}` : ''}`);
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
      // dashboardApi의 endYachtGame 함수 사용
      console.log('[ScoreBoard] endYachtGame 함수 호출, gameId:', gameId);
      const response = await endYachtGame(gameId);
      console.log('[ScoreBoard] 게임 종료 API 응답:', response);
      
      // 게임 종료 성공 시 결과 화면으로 이동
      if (response && response.success) {
        alert('게임이 종료되었습니다.');
        navigate(`/games/TurkeyDice/result?gameId=${gameId}`);
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
      
      alert('게임 종료 중 오류가 발생했습니다.');
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
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreBoard;
