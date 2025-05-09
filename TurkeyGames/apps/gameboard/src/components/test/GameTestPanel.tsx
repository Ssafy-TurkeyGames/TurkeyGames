// components/test/GameTestPanel.tsx
import React, { useState } from 'react';
import { useGameWebSocket } from '../websocket/WebSocketProvider';
import styles from './GameTestPanel.module.css';

const GameTestPanel: React.FC = () => {
  const {
    isConnected,
    gameData,
    connectSocket,
    startGame,
    rollDice,
    selectScore,
    getGameStatus,
    getScores,
    endGame
  } = useGameWebSocket();

  // 게임 설정 상태
  const [settings, setSettings] = useState({
    people: 2,
    map: 0,
    voice: 0
  });

  // 주사위 선택 상태
  const [selectedDice, setSelectedDice] = useState<number[]>([]);

  // 점수 선택 상태
  const [scoreCategory, setScoreCategory] = useState<string>("ace");
  const [scoreValue, setScoreValue] = useState<number>(0);

  // 설정 변경 핸들러
  const handleSettingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: parseInt(value)
    });
  };

  // 게임 시작 핸들러
  const handleStartGame = async () => {
    try {
      await startGame(settings);
    } catch (error) {
      console.error('게임 시작 오류:', error);
    }
  };

  // 주사위 선택 핸들러
  const handleDiceSelect = (index: number) => {
    setSelectedDice(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // 주사위 굴리기 핸들러
  const handleRollDice = async () => {
    if (!gameData || gameData.rolls_left <= 0) return;
    
    try {
      await rollDice(selectedDice);
      setSelectedDice([]);
    } catch (error) {
      console.error('주사위 굴리기 실패:', error);
    }
  };

  // 점수 선택 핸들러
  const handleSelectScore = async () => {
    if (!gameData || !gameData.players || gameData.players.length === 0) return;
    
    try {
      const playerId = gameData.players[gameData.current_player_idx];
      await selectScore(playerId, scoreCategory, scoreValue);
    } catch (error) {
      console.error('점수 선택 실패:', error);
    }
  };

  // 게임 상태 조회 핸들러
  const handleGetGameStatus = async () => {
    try {
      await getGameStatus();
    } catch (error) {
      console.error('게임 상태 조회 실패:', error);
    }
  };

  // 점수 조회 핸들러
  const handleGetScores = async () => {
    try {
      await getScores();
    } catch (error) {
      console.error('점수 조회 실패:', error);
    }
  };

  // 게임 종료 핸들러
  const handleEndGame = async () => {
    try {
      await endGame();
    } catch (error) {
      console.error('게임 종료 실패:', error);
    }
  };

  // 주사위 값 계산
  const calculateScore = () => {
    if (!gameData || !gameData.dice_values) return 0;
    
    const diceValues = gameData.dice_values;
    
    switch (scoreCategory) {
      case 'ace':
        return diceValues.filter(v => v === 1).reduce((sum, v) => sum + v, 0);
      case 'dual':
        return diceValues.filter(v => v === 2).reduce((sum, v) => sum + v, 0);
      case 'triple':
        return diceValues.filter(v => v === 3).reduce((sum, v) => sum + v, 0);
      case 'quad':
        return diceValues.filter(v => v === 4).reduce((sum, v) => sum + v, 0);
      case 'penta':
        return diceValues.filter(v => v === 5).reduce((sum, v) => sum + v, 0);
      case 'hexa':
        return diceValues.filter(v => v === 6).reduce((sum, v) => sum + v, 0);
      case 'chance':
        return diceValues.reduce((sum, v) => sum + v, 0);
      default:
        return 0;
    }
  };

  // 카테고리 변경 시 점수 계산
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScoreCategory(e.target.value);
    setScoreValue(calculateScore());
  };

  return (
    <div className={styles.testPanel}>
      <h2>게임 테스트 패널</h2>
      
      <div className={styles.section}>
        <h3>연결 상태</h3>
        <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
          {isConnected ? '연결됨' : '연결 안됨'}
        </div>
        <button onClick={connectSocket} disabled={isConnected}>
          연결하기
        </button>
      </div>
      
      <div className={styles.section}>
        <h3>게임 설정</h3>
        <div className={styles.formGroup}>
          <label htmlFor="people">플레이어 수:</label>
          <select 
            id="people"
            name="people"
            value={settings.people}
            onChange={handleSettingChange}
            disabled={!isConnected}
          >
            <option value={1}>1명</option>
            <option value={2}>2명</option>
            <option value={3}>3명</option>
            <option value={4}>4명</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="map">맵 설정:</label>
          <select 
            id="map"
            name="map"
            value={settings.map}
            onChange={handleSettingChange}
            disabled={!isConnected}
          >
            <option value={0}>기본</option>
            <option value={1}>맵 1</option>
            <option value={2}>맵 2</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="voice">음성 사용:</label>
          <select 
            id="voice"
            name="voice"
            value={settings.voice}
            onChange={handleSettingChange}
            disabled={!isConnected}
          >
            <option value={0}>사용 안함</option>
            <option value={1}>사용</option>
          </select>
        </div>
        
        <button 
          onClick={handleStartGame}
          disabled={!isConnected}
          className={styles.button}
        >
          새 게임 시작
        </button>
      </div>
      
      {gameData && (
        <>
          <div className={styles.section}>
            <h3>게임 상태</h3>
            <div className={styles.gameInfo}>
              <p>게임 ID: {gameData.id}</p>
              <p>현재 플레이어: {gameData.current_player_idx + 1}</p>
              <p>남은 굴림: {gameData.rolls_left}</p>
            </div>
            
            <div className={styles.buttonGroup}>
              <button onClick={handleGetGameStatus} className={styles.button}>
                상태 조회
              </button>
              <button onClick={handleGetScores} className={styles.button}>
                점수 조회
              </button>
              <button onClick={handleEndGame} className={styles.button}>
                게임 종료
              </button>
            </div>
          </div>
          
          <div className={styles.section}>
            <h3>주사위</h3>
            <div className={styles.diceContainer}>
              {gameData.dice_values.map((value, index) => (
                <div 
                  key={index}
                  className={`${styles.dice} ${selectedDice.includes(index) ? styles.selected : ''}`}
                  onClick={() => handleDiceSelect(index)}
                >
                  {value}
                </div>
              ))}
            </div>
            
            <button 
              onClick={handleRollDice} 
              disabled={gameData.rolls_left <= 0}
              className={styles.button}
            >
              주사위 굴리기
            </button>
          </div>
          
          <div className={styles.section}>
            <h3>점수 선택</h3>
            <div className={styles.formGroup}>
              <label htmlFor="category">카테고리:</label>
              <select 
                id="category"
                value={scoreCategory}
                onChange={handleCategoryChange}
                disabled={gameData.rolls_left !== 0}
              >
                <option value="ace">에이스 (1)</option>
                <option value="dual">듀얼 (2)</option>
                <option value="triple">트리플 (3)</option>
                <option value="quad">쿼드 (4)</option>
                <option value="penta">펜타 (5)</option>
                <option value="hexa">헥사 (6)</option>
                <option value="chance">찬스</option>
                <option value="poker">포커</option>
                <option value="full_house">풀하우스</option>
                <option value="small_straight">스몰 스트레이트</option>
                <option value="large_straight">라지 스트레이트</option>
                <option value="turkey">터키</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="score">점수:</label>
              <input 
                type="number" 
                id="score" 
                value={scoreValue} 
                onChange={(e) => setScoreValue(parseInt(e.target.value) || 0)}
                disabled={gameData.rolls_left !== 0}
              />
            </div>
            
            <button 
              onClick={handleSelectScore}
              disabled={gameData.rolls_left !== 0}
              className={styles.button}
            >
              점수 선택
            </button>
          </div>
        </>
      )}
      
      {gameData && gameData.scores && (
        <div className={styles.section}>
          <h3>점수표</h3>
          <table className={styles.scoreTable}>
            <thead>
              <tr>
                <th>카테고리</th>
                {Array.from({ length: settings.people }).map((_, idx) => (
                  <th key={idx}>플레이어 {idx + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(gameData.scores[0].scorecard).map(([category, _]) => (
                <tr key={category}>
                  <td>{category}</td>
                  {gameData.scores.map((player, idx) => (
                    <td key={idx}>{player.scorecard[category] !== null ? player.scorecard[category] : '-'}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td><strong>총점</strong></td>
                {gameData.scores.map((player, idx) => (
                  <td key={idx}><strong>{player.total_score}</strong></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GameTestPanel;