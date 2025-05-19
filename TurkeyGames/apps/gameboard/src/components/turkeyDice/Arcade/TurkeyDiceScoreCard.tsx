// src/components/turkeyDice/Arcade/TurkeyDiceScoreCard.tsx
import React, { useEffect, useRef, useState } from 'react';
import styles from './TurkeyDiceScoreCard.module.css';
import scoreCardBg from '../../../assets/images/turkey_arcade_score_resize.png';
import { scoreBoardSoundFiles } from '../../../constant/soundFiles';
import buttonClickFile from '../../../assets/sound/default/button/button.mp3';
import scoreButtonClickFile from '../../../assets/sound/default/button/score_button.mp3';
import { calcYachtDice } from '../../../utils/checkYachtDice';

interface TurkeyDiceScoreCardProps {
  playerName?: string;
  playerId?: number;
  myTurn?: boolean;
  aiVoice?: number;
  gameStartFinished?: boolean;
  ace?: number;
  dual?: number;
  triple?: number;
  quad?: number;
  penta?: number;
  hexa?: number;
  chance?: number;
  poker?: number;
  fullHouse?: number;
  smallStraight?: number;
  largeStraight?: number;
  turkey?: number;
  diceValue?: any;
  isGameOver?: boolean;
  nextTurnButtonClick?: () => void;
  throwDiceFunction?: () => void;
  selectScore?: (playerId: number, category: string, value: number) => Promise<void>;
}

const TurkeyDiceScoreCard: React.FC<TurkeyDiceScoreCardProps> = ({ 
  playerName = "Player 1",
  playerId = 1,
  myTurn = false,
  aiVoice = 1,
  gameStartFinished = false,
  ace = 0,
  dual = 0,
  triple = 0,
  quad = 0,
  penta = 0,
  hexa = 0,
  chance = 0,
  poker = 0,
  fullHouse = 0,
  smallStraight = 0,
  largeStraight = 0,
  turkey = 0,
  diceValue,
  isGameOver = false,
  nextTurnButtonClick,
  throwDiceFunction,
  selectScore
}) => {
  // 현재 턴인 플레이어의 카드에 하이라이트 효과 추가
  const cardStyle = myTurn ? {
    border: '3px solid gold',
    boxShadow: '0 0 20px gold'
  } : {};

  // 텍스트 스타일 - 자기 차례가 아닐 때 회색으로 표시
  const textStyle = !myTurn ? { 
    color: '#888888',
    textShadow: 'none',
    WebkitTextStroke: 'none'
  } : {};

  // 총점 계산
  const totalScore = ace + dual + triple + quad + penta + hexa + chance + poker + fullHouse + smallStraight + largeStraight + turkey;

  // 오디오 요소에 대한 참조 생성
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 상태 관리 추가
  const [selectState, setSelectState] = useState<string>('');
  const [rerollButtonState, setRerollButtonState] = useState<boolean>(true);
  const [usedCategories, setUsedCategories] = useState<string[]>([]);
  const [previewScores, setPreviewScores] = useState<any>({});
  
  // AI 음성 매핑
  const aiVoices = ['daegil', 'flower', 'guri'];
  
  // reroll 버튼 클릭 핸들러
  const handleRerollClick = () => {
    if (!myTurn || isGameOver) return;
    
    const ai = aiVoices[aiVoice - 1];
    const rerollFiles = 
      ai === 'daegil' ? scoreBoardSoundFiles.daegil.reroll :
      ai === 'flower' ? scoreBoardSoundFiles.flower.reroll : 
      scoreBoardSoundFiles.guri.reroll;
      
    const randomSound = rerollFiles[Math.floor(Math.random() * rerollFiles.length)];
    
    if (audioRef.current) {
      audioRef.current.src = randomSound;
      
      // 주사위 리롤 안내 음성 끝난후 주사위 새로 굴리기
      audioRef.current.onended = () => {
        if (throwDiceFunction) throwDiceFunction();
      };
      
      audioRef.current.play();
    }
  };

  // 점수 영역 선택 핸들러
  const selectScoreAreaClick = (category: string) => {
    if (!myTurn || usedCategories.includes(category)) return;
    
    if (audioRef.current) {
      audioRef.current.src = scoreButtonClickFile;
      audioRef.current.play();
    }
    
    if (selectState === category) {
      setSelectState('');
      return;
    }
    
    setSelectState(category);
  };

  // 다음 턴 버튼 핸들러
  const handleNextTurnClick = () => {
    if (!myTurn || !selectState) return;
    
    if (nextTurnButtonClick) nextTurnButtonClick();
    
    if (isGameOver) return;
    
    if (selectScore && diceValue && diceValue.dice_values) {
      selectScore(playerId, selectState, calcYachtDice(diceValue.dice_values)[selectState]);
    }
    
    setUsedCategories(prev => [...prev, selectState]);
    setRerollButtonState(true);
    setSelectState('');
    
    if (audioRef.current) {
      audioRef.current.src = buttonClickFile;
      audioRef.current.play();
    }
    
    setPreviewScores({});
  };

  // 턴이 변경될 때 음성 재생
  useEffect(() => {
    if (!gameStartFinished || !myTurn) return;
    if (isGameOver) return;
    
    const ai = aiVoices[aiVoice - 1];
    const myturnFiles = 
      ai === 'daegil' ? scoreBoardSoundFiles.daegil.myturn :
      ai === 'flower' ? scoreBoardSoundFiles.flower.myturn : 
      scoreBoardSoundFiles.guri.myturn;
    
    let randomSoundFiles: any[] = [];
    
    switch(playerId) {
      case 1:
        randomSoundFiles = myturnFiles[1];
        break;
      case 2:
        randomSoundFiles = myturnFiles[2];
        break;
      case 3:
        randomSoundFiles = myturnFiles[3];
        break;
      case 4:
        randomSoundFiles = myturnFiles[4];
        break;
    }
    
    if (audioRef.current && randomSoundFiles.length > 0) {
      audioRef.current.src = randomSoundFiles[Math.floor(Math.random() * randomSoundFiles.length)];
      audioRef.current.play();
    }
  }, [myTurn, gameStartFinished, isGameOver, aiVoice, playerId]);

  // 주사위 값이 변경될 때 미리보기 점수 계산
  useEffect(() => {
    if (!diceValue || !diceValue.dice_values) {
      setPreviewScores({});
      return;
    }
    
    setPreviewScores(calcYachtDice(diceValue.dice_values));
    
    if (diceValue.rolls_left === 0) {
      setRerollButtonState(false);
    }
  }, [diceValue]);

  return (
    <div className={styles.scoreCardWrapper} style={cardStyle}>
      {!myTurn && <div className={styles.block}></div>}
      <img src={scoreCardBg} alt="Score Card Background" className={styles.backgroundImage} />
      <div className={styles.scoreCardContent}>
        <div className={styles.header}>
          <h1 className={styles.title} style={textStyle}>{playerName}</h1>
          <div className={styles.score} style={textStyle}>SCORE {totalScore}</div>
        </div>
        
        <div className={styles.categoryContainer}>
          <div className={styles.divider} style={!myTurn ? { backgroundColor: '#555', boxShadow: 'none' } : {}}></div>
          <div className={styles.categoryList}>
            <div 
              className={styles.categoryItem} 
              onClick={() => selectScoreAreaClick('ace')}
              style={selectState === 'ace' || usedCategories.includes('ace') ? {backgroundColor: 'rgba(138, 43, 226, 0.3)'} : {}}
            >
              <span className={styles.categoryName} style={textStyle}>에이스</span>
              <span className={styles.categoryValue} style={textStyle}>
                {usedCategories.includes('ace') ? 
                  ace : 
                  (Object.keys(previewScores).length !== 0 && myTurn ? previewScores.ace : '')}
              </span>
            </div>
            
            <div 
              className={styles.categoryItem}
              onClick={() => selectScoreAreaClick('dual')}
              style={selectState === 'dual' || usedCategories.includes('dual') ? {backgroundColor: 'rgba(138, 43, 226, 0.3)'} : {}}
            >
              <span className={styles.categoryName} style={textStyle}>듀얼</span>
              <span className={styles.categoryValue} style={textStyle}>
                {usedCategories.includes('dual') ? 
                  dual : 
                  (Object.keys(previewScores).length !== 0 && myTurn ? previewScores.dual : '')}
              </span>
            </div>
            
            <div 
              className={styles.categoryItem}
              onClick={() => selectScoreAreaClick('triple')}
              style={selectState === 'triple' || usedCategories.includes('triple') ? {backgroundColor: 'rgba(138, 43, 226, 0.3)'} : {}}
            >
              <span className={styles.categoryName} style={textStyle}>트리플</span>
              <span className={styles.categoryValue} style={textStyle}>
                {usedCategories.includes('triple') ? 
                  triple : 
                  (Object.keys(previewScores).length !== 0 && myTurn ? previewScores.triple : '')}
              </span>
            </div>
            
            <div 
              className={styles.categoryItem}
              onClick={() => selectScoreAreaClick('quad')}
              style={selectState === 'quad' || usedCategories.includes('quad') ? {backgroundColor: 'rgba(138, 43, 226, 0.3)'} : {}}
            >
              <span className={styles.categoryName} style={textStyle}>쿼드</span>
              <span className={styles.categoryValue} style={textStyle}>
                {usedCategories.includes('quad') ? 
                  quad : 
                  (Object.keys(previewScores).length !== 0 && myTurn ? previewScores.quad : '')}
              </span>
            </div>
            
            <div 
              className={styles.categoryItem}
              onClick={() => selectScoreAreaClick('penta')}
              style={selectState === 'penta' || usedCategories.includes('penta') ? {backgroundColor: 'rgba(138, 43, 226, 0.3)'} : {}}
            >
              <span className={styles.categoryName} style={textStyle}>펜타</span>
              <span className={styles.categoryValue} style={textStyle}>
                {usedCategories.includes('penta') ? 
                  penta : 
                  (Object.keys(previewScores).length !== 0 && myTurn ? previewScores.penta : '')}
              </span>
            </div>
            
            <div 
              className={styles.categoryItem}
              onClick={() => selectScoreAreaClick('hexa')}
              style={selectState === 'hexa' || usedCategories.includes('hexa') ? {backgroundColor: 'rgba(138, 43, 226, 0.3)'} : {}}
            >
              <span className={styles.categoryName} style={textStyle}>헥사</span>
              <span className={styles.categoryValue} style={textStyle}>
                {usedCategories.includes('hexa') ? 
                  hexa : 
                  (Object.keys(previewScores).length !== 0 && myTurn ? previewScores.hexa : '')}
              </span>
            </div>
            
            <div 
              className={styles.categoryItem}
              onClick={() => selectScoreAreaClick('poker')}
              style={selectState === 'poker' || usedCategories.includes('poker') ? {backgroundColor: 'rgba(138, 43, 226, 0.3)'} : {}}
            >
              <span className={styles.categoryName} style={textStyle}>포커</span>
              <span className={styles.categoryValue} style={textStyle}>
                {usedCategories.includes('poker') ? 
                  poker : 
                  (Object.keys(previewScores).length !== 0 && myTurn ? previewScores.poker : '')}
              </span>
            </div>
            
            <div 
              className={styles.categoryItem}
              onClick={() => selectScoreAreaClick('full_house')}
              style={selectState === 'full_house' || usedCategories.includes('full_house') ? {backgroundColor: 'rgba(138, 43, 226, 0.3)'} : {}}
            >
              <span className={styles.categoryName} style={textStyle}>풀하우스</span>
              <span className={styles.categoryValue} style={textStyle}>
                {usedCategories.includes('full_house') ? 
                  fullHouse : 
                  (Object.keys(previewScores).length !== 0 && myTurn ? previewScores.full_house : '')}
              </span>
            </div>
            
            <div 
              className={styles.categoryItem}
              onClick={() => selectScoreAreaClick('small_straight')}
              style={selectState === 'small_straight' || usedCategories.includes('small_straight') ? {backgroundColor: 'rgba(138, 43, 226, 0.3)'} : {}}
            >
              <span className={styles.categoryName} style={textStyle}>S.S</span>
              <span className={styles.categoryValue} style={textStyle}>
                {usedCategories.includes('small_straight') ? 
                  smallStraight : 
                  (Object.keys(previewScores).length !== 0 && myTurn ? previewScores.small_straight : '')}
              </span>
            </div>
            
            <div 
              className={styles.categoryItem}
              onClick={() => selectScoreAreaClick('large_straight')}
              style={selectState === 'large_straight' || usedCategories.includes('large_straight') ? {backgroundColor: 'rgba(138, 43, 226, 0.3)'} : {}}
            >
              <span className={styles.categoryName} style={textStyle}>L.S</span>
              <span className={styles.categoryValue} style={textStyle}>
                {usedCategories.includes('large_straight') ? 
                  largeStraight : 
                  (Object.keys(previewScores).length !== 0 && myTurn ? previewScores.large_straight : '')}
              </span>
            </div>
            
            <div 
              className={styles.categoryItem}
              onClick={() => selectScoreAreaClick('turkey')}
              style={selectState === 'turkey' || usedCategories.includes('turkey') ? {backgroundColor: 'rgba(138, 43, 226, 0.3)'} : {}}
            >
              <span className={styles.categoryName} style={textStyle}>터키</span>
              <span className={styles.categoryValue} style={textStyle}>
                {usedCategories.includes('turkey') ? 
                  turkey : 
                  (Object.keys(previewScores).length !== 0 && myTurn ? previewScores.turkey : '')}
              </span>
            </div>
            
            <div 
              className={styles.categoryItem}
              onClick={() => selectScoreAreaClick('chance')}
              style={selectState === 'chance' || usedCategories.includes('chance') ? {backgroundColor: 'rgba(138, 43, 226, 0.3)'} : {}}
            >
              <span className={styles.categoryName} style={textStyle}>찬스</span>
              <span className={styles.categoryValue} style={textStyle}>
                {usedCategories.includes('chance') ? 
                  chance : 
                  (Object.keys(previewScores).length !== 0 && myTurn ? previewScores.chance : '')}
              </span>
            </div>
          </div>
        </div>
        
        <div className={styles.buttonArea}>
          <button 
            className={styles.rerollButton} 
            disabled={!myTurn || !rerollButtonState || isGameOver}
            onClick={handleRerollClick}
          >
            REROLL
          </button>
          <button 
            className={styles.nextTurnButton} 
            disabled={!myTurn || !selectState || isGameOver}
            onClick={handleNextTurnClick}
          >
            NEXT TURN
          </button>
        </div>
      </div>
      <audio ref={audioRef} />
    </div>
  );
};

export default TurkeyDiceScoreCard;
