// routes/turkeyDiceRoute/TurkeyDiceRoute.tsx
import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import TurkeyDice from '../../pages/turkeyDicePage/TurkeyDice';
import GameTestPanel from '../../components/test/GameTestPanel';
import { useGameWebSocket } from '../../components/websocket/WebSocketProvider';
import styles from './TurkeyDiceRoute.module.css';

export default function TurkeyDiceRoute() {
  const { isConnected, gameData } = useGameWebSocket();
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [minimizeUi, setMinimizeUi] = useState(false);

  return (
    <div className={styles.container}>
      {/* 테스트 패널 토글 버튼 */}
      <div className={styles.controls}>
        <button
          className={styles.toggleButton}
          onClick={() => setShowTestPanel(!showTestPanel)}
        >
          {showTestPanel ? '테스트 패널 숨기기' : '테스트 패널 표시'}
        </button>
        
        <button
          className={styles.minimizeButton}
          onClick={() => setMinimizeUi(!minimizeUi)}
        >
          {minimizeUi ? 'UI 복원' : 'UI 최소화'}
        </button>
      </div>
      
      {/* 테스트 패널 (토글 시 표시) */}
      {showTestPanel && (
        <div className={styles.testPanelContainer}>
          <GameTestPanel />
        </div>
      )}
      
      {/* 게임 UI (최소화 모드일 때 숨김) */}
      {!minimizeUi && (
        <div className={styles.turkeyDiceWrapper}>
          <TurkeyDice />
        </div>
      )}
      
      {/* 게임 정보 로거 (최소화 모드일 때 표시) */}
      {minimizeUi && (
        <div className={styles.gameLogger}>
          <h2>게임 정보 로거</h2>
          <div className={styles.connectionStatus}>
            연결 상태: {isConnected ? '연결됨' : '연결 안됨'}
          </div>
          
          {gameData ? (
            <div className={styles.gameInfo}>
              <p>게임 ID: {gameData.id}</p>
              <p>플레이어 수: {gameData.players?.length || 0}</p>
              <p>현재 플레이어: {gameData.current_player_idx + 1}</p>
              <p>남은 굴림: {gameData.rolls_left}</p>
              <p>주사위 값: {gameData.dice_values?.join(', ') || '없음'}</p>
              
              {gameData.is_finished && (
                <p className={styles.gameFinished}>게임 종료됨!</p>
              )}
            </div>
          ) : (
            <p>게임 데이터가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}