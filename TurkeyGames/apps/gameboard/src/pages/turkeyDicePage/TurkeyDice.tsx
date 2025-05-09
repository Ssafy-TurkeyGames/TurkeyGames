// pages/turkeyDice/TurkeyDice.tsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './TurkeyDice.module.css';
import turkey from '../../assets/images/turkey.png';
import acadeTurkey from '../../assets/images/turkey_acade.png';
import SpinTurkey from '../../components/common/spinTurkey/SpinTurkey';
import turkeyDiceDefaultMap from '../../assets/images/turkey_default_map.png';
import turkeyDuceDefaultScore from '../../assets/images/turkey_default_score.png';
import turkeyDiceAcadeMap from '../../assets/images/turkey_acade_map.png';
import turkeyDiceAcadeScore from '../../assets/images/turkey_acade_score.png';
import TurkeyDiceScoreCard from '../../components/turkeyDice/TurkeyDiceScoreCard/TurkeyDiceScoreCard';
import { SpriteAnimator } from 'react-sprite-animator';
import test from '../../assets/effect/test.jpg';
import { useGameWebSocket } from '../../components/websocket/WebSocketProvider';

// 위치 상태 타입 정의
interface LocationState {
  gameData: any;
}

export default function TurkeyDice() {
  // 라우터 location에서 state 가져오기
  const location = useLocation();
  const locationState = location.state as LocationState;
  
  // 웹소켓 Context에서 데이터 가져오기
  const { gameData: contextGameData, isConnected } = useGameWebSocket();
  
  // 로컬 상태
  const [gameData, setGameData] = useState<any>(
    locationState?.gameData || contextGameData || null
  );
  
  // 컴포넌트 마운트 시 데이터 초기화
  useEffect(() => {
    if (locationState?.gameData) {
      console.log('라우터에서 게임 데이터 받음:', locationState.gameData);
      setGameData(locationState.gameData);
      console.log(locationState.gameData)
    } else if (contextGameData) {
      console.log('컨텍스트에서 게임 데이터 받음:', contextGameData);
      setGameData(contextGameData);
    }
  }, [locationState, contextGameData]);
  
  // contextGameData가 업데이트될 때 로컬 상태 업데이트
  useEffect(() => {
    if (contextGameData) {
      setGameData(contextGameData);
    }
  }, [contextGameData]);
  
  // 게임 데이터가 없으면 로딩 상태 표시
  if (!gameData) {
    return 
  }
  
  // 플레이어 수에 따라 렌더링할 점수 카드 배열 생성
  const renderScoreCards = () => {
    const cards = [];
    
    // 게임 데이터가 없으면 기본값
    if (!gameData || !gameData.settings || !gameData.settings.people) {
      return [
        <TurkeyDiceScoreCard key={0} image={turkeyDuceDefaultScore} playerIndex={0} />,
        <TurkeyDiceScoreCard key={1} image={turkeyDuceDefaultScore} playerIndex={1} />
      ];
    }
    
    // 플레이어 수
    const playerCount = gameData.settings.people;
    
    // 최대 4명으로 제한
    const validCount = Math.min(playerCount, 4);
    
    for (let i = 0; i < validCount; i++) {
      cards.push(
        <TurkeyDiceScoreCard 
          key={i} 
          image={turkeyDuceDefaultScore} 
          playerIndex={i}
          playerName={`Player ${i + 1}`}
          isActive={gameData.current_player_idx === i}
        />
      );
    }
    
    return cards;
  };

  // 음성 설정 (기본값: 0)
  const voiceSetting = gameData.settings?.voice || 0;
  const playerCount = gameData.settings?.people || 2;

  return (
    <div className={styles.layout}>

      <div className={styles.spinBox}>
        <SpinTurkey image={turkey} />
      </div>
      
      {/* 왼쪽 영역 - 플레이어 수에 따라 동적으로 렌더링 */}
      <div className={styles.leftArea}>
        {playerCount > 0 && renderScoreCards().slice(0, Math.ceil(playerCount / 2))}
      </div>
      
      <div className={styles.map}>
        <img 
          src={voiceSetting === 0 ? turkeyDiceDefaultMap : turkeyDiceAcadeMap} 
          alt="turkeyDice Map" 
        />
      </div>
      
      {/* 오른쪽 영역 - 플레이어 수에 따라 동적으로 렌더링 */}
      <div className={styles.rightArea}>
        {playerCount > 1 && renderScoreCards().slice(Math.ceil(playerCount / 2))}
      </div>
    </div>
  );
}