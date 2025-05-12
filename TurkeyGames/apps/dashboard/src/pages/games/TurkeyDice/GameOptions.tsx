/* apps/dashboard/src/pages/games/TurkeyDice/GameOptions.tsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button/Button';
import PlayerOption from '../../../components/common/PlayerOption/PlayerOption';
import BoardSelect from '../../../components/games/TurkeyDice/BoardSelect';
import VoiceOption from '../../../components/games/VoiceOption';
import styles from './GameOptions.module.css';
import userIcon from '../../../assets/images/user.png';
import boardIcon from '../../../assets/images/board.png';
import micIcon from '../../../assets/images/mic.png';
import turkeyIcon from '../../../assets/images/turkey.png';
import arcadeIcon from '../../../assets/images/arcade.png';
import closeIcon from '../../../assets/images/close (1).png';
import { useSocket } from '../../../hooks/useSocket';
import axios from 'axios';

// API 서버 URL
const API_URL = 'http://192.168.30.158:8000';

// 목소리 ID 변환 함수
const getVoiceId = (voiceName: string | null): number => {
  if (!voiceName) return 1;
  
  const voiceMap: Record<string, number> = {
    '대길': 1,
    '개나리': 2,
    '구리': 3
  };
  
  return voiceMap[voiceName] || 1;
};

// 플레이어 이름 생성 함수
const generatePlayerNames = (count: number): string[] => {
  const names = ['가현', '경록', '웅지', '동현'];
  return names.slice(0, count);
};

export default function TurkeyDiceOptions() {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [step, setStep] = useState(0);
  const [players, setPlayers] = useState<number | null>(null);
  const [board, setBoard] = useState<'Turkey' | 'Arcade' | null>(null);
  const [voice, setVoice] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!socket) return;

    // 게임 상태 업데이트 이벤트
    socket.on('game_status_update', (data) => {
      console.log('게임 상태 업데이트:', data);
      // 필요한 경우 게임 상태 처리
    });

    return () => {
      socket.off('game_status_update');
    };
  }, [socket]);

  // 게임 시작 처리
  const handleStartGame = async () => {
    if (!players || !board || !voice) {
      console.error('게임 옵션이 모두 선택되지 않았습니다.');
      return;
    }

    setIsCreatingGame(true);
    
    try {
      // API 명세에 맞게 게임 생성 요청 데이터 구성
      const requestData = {
        people: players,
        map: board === 'Turkey' ? 1 : 2, // Turkey는 1, Arcade는 2로 변환
        voice: getVoiceId(voice),
        player_names: generatePlayerNames(players)
      };
      
      console.log('게임 생성 요청 전송:', requestData);
      
      // HTTP API를 통해 게임 생성 요청
      const response = await axios.post(`${API_URL}/yacht/start`, requestData);
      
      console.log('게임 생성 응답:', response.data);
      
      // 게임 ID 저장
      const newGameId = response.data.id;
      setGameId(newGameId);
      
      // 게임 생성 후 스코어보드로 이동
      navigate(`/games/TurkeyDice/score?gameId=${newGameId}`);
    } catch (error) {
      console.error('게임 생성 오류:', error);
      alert('게임 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsCreatingGame(false);
    }
  };

  // 최종 확인 및 게임 시작 단계 렌더링
  const renderFinalStep = () => (
    <div className={styles.stepBox}>
      <button className={styles.closeBtn} onClick={() => navigate(-1)}>
        <img src={closeIcon} alt="닫기" />
      </button>
      <div className={styles.finalRow}>
        <div>
          <img src={userIcon} alt="플레이어" className={styles.iconSmall} />
          <div className={styles.badge}>{players}인</div>
        </div>
        <div>
          <img src={boardIcon} alt="보드" className={styles.iconSmall} />
          <div className={styles.badge}>
            {board === 'Turkey' ? "꼬끼오 결투장" : "아케이드 결투장"}
          </div>
        </div>
        <div>
          <img src={micIcon} alt="마이크" className={styles.iconSmall} />
          <div className={styles.badge}>{voice}</div>
        </div>
      </div>
      <Button
        variant="primary"
        className={styles.startBtn}
        onClick={handleStartGame}
        disabled={isCreatingGame}
      >
        {isCreatingGame ? '게임 생성 중...' : '게임 시작'}
      </Button>
      
      {/* 연결 상태 표시 (개발 중에만 사용, 배포 시 제거) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={styles.connectionStatus} style={{ marginTop: '10px', fontSize: '12px', color: isConnected ? 'green' : 'red' }}>
          {isConnected ? '서버 연결됨' : '서버 연결 중...'}
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.optionsRoot}>
      <div className={styles.optionsCard}>
        <button className={styles.closeBtn} onClick={() => navigate(-1)}>
          <img src={closeIcon} alt="닫기" />
        </button>
        {step === 0 && (
          <div className={styles.centerWrap}>
            <PlayerOption
              options={[2, 3, 4]}
              selected={players}
              onSelect={setPlayers}
              title="플레이어 수를 선택하세요"
            />
            <Button
              variant="primary"
              disabled={players === null}
              onClick={() => setStep(1)}
            >
              다음
            </Button>
          </div>
        )}
        {step === 1 && (
          <BoardSelect
            selectedBoard={board}
            onSelect={setBoard}
            players={players!}
            onNextStep={() => setStep(2)}
            onPrevStep={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <VoiceOption
            selectedVoice={voice}
            onSelect={setVoice}
            players={players!}
            selectedBoard={board!}
            onConfirm={() => setStep(3)}
            onCancel={() => setStep(1)}
          />
        )}
        {step === 3 && renderFinalStep()}
      </div>
    </div>
  );
}
