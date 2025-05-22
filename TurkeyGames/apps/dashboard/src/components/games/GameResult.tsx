// src/components/games/GameResult.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import styles from './GameResult.module.css';
import Logo from '../common/Logo';
import { useSocket } from '../../hooks/useSocket';
// 등수 이미지 import
import rank1 from '../../assets/images/ranks/1.png';
import rank2 from '../../assets/images/ranks/2.png';
import rank3 from '../../assets/images/ranks/3.png';
import rank4 from '../../assets/images/ranks/4.png';
import rankEffect from '../../assets/images/ranks/rank_effect.png';
import { deleteYachtGame } from '../../api/dashboardApi';

// API 서버 URL
const SOCKET_SERVER_URL = 'http://localhost:8000';

interface PlayerResult {
  id: number;
  name: string;
  score: number;
  rank?: number;
}

interface GameResultProps {
  players: PlayerResult[];
  gameId: string;
}

const GameResult: React.FC<GameResultProps> = ({ players, gameId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // 컴포넌트 마운트 시 gameId 확인 (디버깅용)
  useEffect(() => {
    console.log('[GameResult] 컴포넌트 마운트, gameId:', gameId);
  }, [gameId]);

  // 방어 코드 추가
  const arrPlayers = Array.isArray(players) ? players : [];
  const sortedPlayers = [...arrPlayers].sort((a, b) => b.score - a.score);
  
  let currentRank = 1;
  let prevScore = -1;
  const rankedPlayers = sortedPlayers.map((player, index) => {
    if (index > 0 && player.score < prevScore) {
      currentRank = index + 1;
    }
    prevScore = player.score;
    return { ...player, rank: currentRank };
  });

  // 등수별 이미지 매핑
  const getRankImage = (rank: number) => {
    switch(rank) {
      case 1: return rank1;
      case 2: return rank2;
      case 3: return rank3;
      case 4: return rank4;
      default: return rank4;
    }
  };

  // 게임 삭제 함수
  const deleteGame = async () => {
    if (!gameId) {
      console.log('[GameResult] gameId가 없어서 삭제를 진행하지 않습니다. gameId:', gameId);
      return;
    }
    if (isDeleting) {
      console.log('[GameResult] 이미 삭제 중입니다.');
      return;
    }
    
    try {
      setIsDeleting(true);
      console.log('[GameResult] 게임 삭제 요청 시작, gameId:', gameId);
      
      // DELETE API 호출
      const result = await deleteYachtGame(gameId);
      console.log('[GameResult] 게임 삭제 API 응답:', result);
      
      // 웹소켓 이벤트 발송
      if (socket && isConnected) {
        socket.emit('delete_game', { gameId });
        console.log('[GameResult] delete_game 이벤트 발송, gameId:', gameId);
      }
      
      return true; // 삭제 성공 시 true 반환
    } catch (error) {
      console.error('[GameResult] 게임 삭제 오류:', error);
      
      // 오류 세부 정보 로깅
      if (axios.isAxiosError(error)) {
        console.error('- 상태 코드:', error.response?.status);
        console.error('- 응답 데이터:', error.response?.data);
      }
      
      // alert('게임을 삭제하는 중 오류가 발생했습니다.');
      return false; // 삭제 실패 시 false 반환
    } finally {
      setIsDeleting(false);
    }
  };

  const handleHighlightClick = () => {
  console.log('[GameResult] 하이라이트 버튼 클릭');
  
  // 1등 플레이어 찾기 (하이라이트를 위한 playerId로 사용)
  const winner = rankedPlayers.find(player => player.rank === 1);
  const playerId = winner ? winner.id.toString() : '1'; // 기본값 제공
  
  // 올바른 경로 형식 사용 (/highlight/:gameId/:playerId)
  navigate(`/highlight/${gameId}/${playerId}`, {
    state: {
      backgroundLocation: location,
      qrValue: 'https://example.com/turkey-dice-highlight',
      title: 'QR코드를 인식하면 최고의 플레이 영상을 보실 수 있어요!'
    }
  });
};

  const handleRetryClick = async () => {
    console.log('[GameResult] 다시하기 버튼 클릭, gameId:', gameId);
    
    // 게임 삭제 처리
    const deleted = await deleteGame();
    
    // 삭제 성공 여부와 관계없이 새 게임 옵션 페이지로 이동
    // 실패해도 사용자 경험을 위해 이동
    navigate(`/game-options/`);
  };

  const handleBackClick = async () => {
    console.log('[GameResult] 그만하기 버튼 클릭, gameId:', gameId);

    // 게임 삭제 처리
    const deleted = await deleteGame();
    
    // 홈으로 이동
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Logo size="medium" />
      </div>
      
      <h1 className={styles.title}>게임 결과</h1>
      
      <div className={styles.resultContainer}>
        <div className={styles.resultHeader}>
          <div className={styles.rankHeader}>RANK</div>
          <div className={styles.playerHeader}>PLAYER</div>
          <div className={styles.scoreHeader}>SCORE</div>
        </div>
        
        <div className={styles.resultRows}>
          {rankedPlayers.map((player) => (
            <div 
              key={player.id} 
              className={`${styles.resultRow} ${player.rank === 1 ? styles.firstPlace : ''}`}
            >
              <div className={styles.rankCell}>
                <img 
                  src={getRankImage(player.rank || 1)} 
                  alt={`${player.rank}등`} 
                  className={styles.rankImage}
                />
                {player.rank === 1 && (
                  <img 
                    src={rankEffect} 
                    alt="1등 효과" 
                    className={styles.rankEffect}
                  />
                )}
              </div>
              <div className={styles.playerName}>{player.name}</div>
              <div className={styles.playerScore}>{player.score}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 게임 ID 표시 (디버깅용, 필요시 주석 처리) */}
      <div className={styles.gameIdDisplay}>
        게임 ID: {gameId || '없음'}
      </div>
      
      <div className={styles.buttonContainer}>
        <button 
          className={styles.highlightButton} 
          onClick={handleHighlightClick}
          disabled={isDeleting}
        >
          하이라이트
        </button>
        <button 
          className={styles.retryButton} 
          onClick={handleRetryClick}
          disabled={isDeleting}
        >
          {isDeleting ? '처리 중...' : '다시하기'}
        </button>
        <button 
          className={styles.backButton} 
          onClick={handleBackClick}
          disabled={isDeleting}
        >
          {isDeleting ? '처리 중...' : '그만하기'}
        </button>
      </div>
    </div>
  );
};

export default GameResult;