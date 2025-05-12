import React, { useState, useEffect, useCallback } from 'react';
import styles from './FiveSecGame.module.css';
import FiveSecPlayerCard from '../fiveSecPlayerCard/FiveSecPlayerCard';
import FiveSecTimer from '../fiveSecTimer/FiveSecTimer';
import { fiveSecApi, GameState } from '../../../api/fiveSecApi';

// 예시 질문들
const sampleQuestions: string[] = [
  "과일 세 가지를 말하세요!",
  "탈 것 세 가지를 말하세요!",
  "직업 세 가지를 말하세요!",
  "인기 영화 세 가지를 말하세요!",
  "유명한 가수 세 가지를 말하세요!",
  "도시 이름 세 가지를 말하세요!",
  "스포츠 세 가지를 말하세요!",
  "음식 세 가지를 말하세요!",
  "동물 세 가지를 말하세요!",
  "나라 이름 세 가지를 말하세요!",
];

type VoteType = 'approve' | 'reject' | null;
type PlayerVotes = { [playerId: string]: VoteType };

export default function FiveSecGame(): JSX.Element {
  // 게임 상태
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isTimerComplete, setIsTimerComplete] = useState<boolean>(false);
  const [playerVotes, setPlayerVotes] = useState<PlayerVotes>({}); 
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [roundCount, setRoundCount] = useState<number>(10);
  const [hasScoreProcessed, setHasScoreProcessed] = useState<boolean>(false);
  const [isFirstRound, setIsFirstRound] = useState<boolean>(true);
  const [showQuestion, setShowQuestion] = useState<boolean>(false);

  // 게임 시작
  const startGame = async (): Promise<void> => {
    try {
      const newGameState = await fiveSecApi.startGame(playerCount, roundCount);
      setGameState(newGameState);
      setIsGameStarted(true);
      
      // 질문은 숨김
      setShowQuestion(false);
      
      // 투표 상태 초기화
      const votes: PlayerVotes = {};
      newGameState.players.forEach(playerId => {
        votes[playerId] = null;
      });
      setPlayerVotes(votes);
      setHasScoreProcessed(false);
      setIsFirstRound(true);
      setIsTimerComplete(true); // 첫 번째 플레이어가 바로 레디 버튼을 볼 수 있도록
    } catch (error) {
      alert('게임을 시작하는 데 문제가 발생했습니다: ' + (error as Error).message);
    }
  };

  // 랜덤 질문 설정
  const setRandomQuestion = (): void => {
    const questionIndex = Math.floor(Math.random() * sampleQuestions.length);
    setCurrentQuestion(sampleQuestions[questionIndex]);
  };

  // 플레이어 투표 처리
  const handleVote = (playerId: string, vote: 'approve' | 'reject'): void => {
    setPlayerVotes(prev => ({
      ...prev,
      [playerId]: vote
    }));
  };

  // 모든 플레이어가 투표했는지 확인 (현재 플레이어 제외)
  const checkAllVoted = useCallback((): boolean => {
    if (!gameState) return false;
    
    const currentPlayerId = gameState.players[gameState.current_player_idx];
    
    return gameState.players.every(playerId => {
      // 현재 플레이어는 투표하지 않음
      if (playerId === currentPlayerId) return true;
      return playerVotes[playerId] !== null;
    });
  }, [gameState, playerVotes]);

  // 투표 결과 처리
  const processVoteResult = useCallback(async (): Promise<void> => {
    if (!gameState || !checkAllVoted() || hasScoreProcessed) return;

    const currentPlayerId = gameState.players[gameState.current_player_idx];
    
    // 찬성 표 계산 (현재 플레이어 제외)
    const approveCount = gameState.players
      .filter(playerId => playerId !== currentPlayerId)
      .filter(playerId => playerVotes[playerId] === 'approve')
      .length;
    
    const totalVoters = gameState.players.length - 1; // 현재 플레이어 제외
    const isApproved = approveCount > totalVoters / 2; // 과반수 찬성

    try {
      setHasScoreProcessed(true); // 점수 처리 시작

      if (isApproved) {
        const currentScore = gameState.scores[currentPlayerId] || 0;
        await fiveSecApi.updateScore(gameState.id, currentPlayerId, currentScore + 1);
      }
      
      // 게임 상태 업데이트
      const updatedState = await fiveSecApi.getGameState(gameState.id);
      setGameState(updatedState);
      
    } catch (error) {
      alert('점수 업데이트 중 오류가 발생했습니다: ' + (error as Error).message);
    }
  }, [gameState, playerVotes, checkAllVoted, hasScoreProcessed]);

  // 투표가 완료되면 결과 처리
  useEffect(() => {
    if (checkAllVoted() && !hasScoreProcessed && isTimerComplete) {
      processVoteResult();
    }
  }, [checkAllVoted, processVoteResult, hasScoreProcessed, isTimerComplete]);

  // 게임 종료 체크
  useEffect(() => {
    if (gameState?.status === 'finished') {
      endGame();
    }
  }, [gameState?.status]);

  // 레디 버튼 클릭 (타이머 시작 및 다음 턴으로)
  const handleReady = async (): Promise<void> => {
    if (!gameState) return;

    try {
      // 질문 설정 및 표시
      setRandomQuestion();
      setShowQuestion(true);
      
      // 타이머 시작
      setIsTimerRunning(true);
      setIsTimerComplete(false);

      // 첫 번째 라운드가 아니면 다음 턴으로 이동
      if (!isFirstRound) {
        const updatedState = await fiveSecApi.nextTurn(gameState.id);
        setGameState(updatedState);
        
        // 투표 상태 초기화
        const votes: PlayerVotes = {};
        updatedState.players.forEach(playerId => {
          // 현재 플레이어는 자동으로 찬성 처리
          const isCurrentPlayer = playerId === updatedState.players[updatedState.current_player_idx];
          votes[playerId] = isCurrentPlayer ? 'approve' : null;
        });
        setPlayerVotes(votes);
        setHasScoreProcessed(false);

        // 게임이 끝났는지 체크
        if (updatedState.status === 'finished' || updatedState.round > updatedState.max_rounds) {
          alert('게임이 종료되었습니다! 최종 점수를 확인하세요.');
          await endGame();
        }
      } else {
        // 첫 번째 라운드는 다음 턴으로 넘어가지 않음
        setIsFirstRound(false);
        // 현재 플레이어에게 자동으로 찬성 표시
        const currentPlayerId = gameState.players[gameState.current_player_idx];
        setPlayerVotes(prev => ({
          ...prev,
          [currentPlayerId]: 'approve'
        }));
      }
    } catch (error) {
      alert('다음 턴으로 넘기는 데 문제가 발생했습니다: ' + (error as Error).message);
    }
  };

  // 타이머 완료 처리
  const handleTimerComplete = (): void => {
    setIsTimerRunning(false);
    setIsTimerComplete(true);
  };

  // 게임 종료
  const endGame = async (): Promise<void> => {
    if (!gameState) return;

    try {
      await fiveSecApi.endGame(gameState.id);
      const finalScores = await fiveSecApi.getFinalScores(gameState.id);
      
      // 점수 정렬 및 출력
      const sortedScores = Object.entries(finalScores)
        .sort((a, b) => b[1] - a[1])
        .map(([playerId, score], index) => 
          `${index + 1}위: 플레이어 ${playerId} - ${score}점`
        );
      
      alert('최종 점수:\n' + sortedScores.join('\n'));
      
      // 게임 초기화
      setIsGameStarted(false);
      setGameState(null);
    } catch (error) {
      alert('게임을 종료하는 데 문제가 발생했습니다: ' + (error as Error).message);
    }
  };

  // 게임 시작 전 화면
  if (!isGameStarted) {
    return (
      <div className={styles.setupContainer}>
        <h1>5초준다 게임</h1>
        <div className={styles.setupForm}>
          <div>
            <label>플레이어 수:</label>
            <input 
              type="number" 
              min="2" 
              max="10" 
              value={playerCount}
              onChange={(e) => setPlayerCount(Number(e.target.value))}
            />
          </div>
          <div>
            <label>라운드 수:</label>
            <input 
              type="number" 
              min="1" 
              max="20" 
              value={roundCount}
              onChange={(e) => setRoundCount(Number(e.target.value))}
            />
          </div>
          <button onClick={startGame}>게임 시작</button>
        </div>
      </div>
    );
  }

  // 다음 플레이어 인덱스 계산
  const nextPlayerIdx = isFirstRound ? 
    gameState.current_player_idx : 
    (gameState.current_player_idx + 1) % gameState.players.length;

  // 게임 화면
  return (
    <div className={styles.layout}>
      {/* 게임 정보 */}
      <div className={styles.gameInfo}>
        <span>라운드: {gameState?.round} / {gameState?.max_rounds}</span>
      </div>
      
      {/* 왼쪽 플레이어들 */}
      <div className={styles.leftArea}>
        {gameState?.players.slice(0, 2).map((playerId, index) => {
          const isCurrentPlayer = index === gameState.current_player_idx;
          const shouldShowReady = isFirstRound ? 
            (isCurrentPlayer && isTimerComplete && !showQuestion) : 
            (checkAllVoted() && index === nextPlayerIdx && isTimerComplete);
            
          return (
            <FiveSecPlayerCard
              key={playerId}
              playerId={playerId}
              score={gameState.scores[playerId] || 0}
              isCurrentPlayer={isCurrentPlayer}
              vote={playerVotes[playerId]}
              onVote={(vote) => handleVote(playerId, vote)}
              isReady={shouldShowReady}
              onReady={handleReady}
              canVote={!isCurrentPlayer && isTimerComplete}
            />
          );
        })}
      </div>

      {/* 중앙 영역 */}
      <div className={styles.centerArea}>
        {showQuestion && (
          <div className={styles.questionBox}>
            <div className={styles.question}>{currentQuestion}</div>
            <FiveSecTimer 
              isRunning={isTimerRunning}
              onComplete={handleTimerComplete}
            />
            <div className={styles.questionReverse}>{currentQuestion}</div>
          </div>
        )}
        
        {!showQuestion && isFirstRound && (
          <div className={styles.waitingMessage}>
            첫 번째 플레이어가 준비 버튼을 누르면 게임이 시작됩니다!
          </div>
        )}
        
        {gameState?.status === 'finished' && (
          <button className={styles.endButton} onClick={endGame}>
            게임 종료
          </button>
        )}
      </div>

      {/* 오른쪽 플레이어들 */}
      <div className={styles.rightArea}>
        {gameState?.players.slice(2, 4).map((playerId, index) => {
          const globalIndex = index + 2;
          const isCurrentPlayer = globalIndex === gameState.current_player_idx;
          const shouldShowReady = isFirstRound ? 
            (isCurrentPlayer && isTimerComplete && !showQuestion) : 
            (checkAllVoted() && globalIndex === nextPlayerIdx && isTimerComplete);
            
          return (
            <FiveSecPlayerCard
              key={playerId}
              playerId={playerId}
              score={gameState.scores[playerId] || 0}
              isCurrentPlayer={isCurrentPlayer}
              vote={playerVotes[playerId]}
              onVote={(vote) => handleVote(playerId, vote)}
              isReady={shouldShowReady}
              onReady={handleReady}
              canVote={!isCurrentPlayer && isTimerComplete}
            />
          );
        })}
      </div>
    </div>
  );
}