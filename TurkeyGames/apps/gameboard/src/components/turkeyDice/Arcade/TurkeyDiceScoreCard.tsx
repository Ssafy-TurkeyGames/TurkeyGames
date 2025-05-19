// src/components/turkeyDice/Arcade/TurkeyDiceScoreCard.tsx
import React, { useEffect, useRef, useState } from 'react';
import styles from './TurkeyDiceScoreCard.module.css';
import scoreCardBg from '../../../assets/images/turkey_arcade_score_resize.png';
import { scoreBoardSoundFiles } from '../../../constant/soundFiles';
import buttonClickFile from '../../../assets/sound/default/button/button.mp3';
import scoreButtonClickFile from '../../../assets/sound/default/button/score_button.mp3';
import { calcYachtDice } from '../../../utils/checkYachtDice';

interface TurkeyDiceScoreCardProps {
  playerName: string;
  playerId: number;
  score: number;
  myTurn: boolean;
  aiVoice: number;
  gameStartFinished: boolean;
  ace: number;
  dual: number;
  triple: number;
  quad: number;
  penta: number;
  hexa: number;
  chance: number;
  poker: number;
  fullHouse: number;
  smallStraight: number;
  largeStraight: number;
  turkey: number;
  diceValue: any;
  isGameOver: boolean;
  winnerPlayer: number;
  nextTurnButtonClick: () => void;
  throwDiceFunction: () => void;
  selectScore: (playerId: number, category: string, value: number) => Promise<void>;
}

const TurkeyDiceScoreCard: React.FC<TurkeyDiceScoreCardProps> = ({ 
  playerName,
  playerId,
  score,
  myTurn,
  aiVoice,
  gameStartFinished,
  ace,
  dual,
  triple,
  quad,
  penta,
  hexa,
  chance,
  poker,
  fullHouse,
  smallStraight,
  largeStraight,
  turkey,
  diceValue,
  isGameOver,
  winnerPlayer,
  nextTurnButtonClick,
  throwDiceFunction,
  selectScore
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [selectState, setSelectState] = useState<string>('');
  const [rerollButtonState, setRerollButtonState] = useState<boolean>(true);
  const [usedCategories, setUsedCategories] = useState<string[]>([]);
  const [previewScores, setPreviewScores] = useState<any>({});

  // AI 음성 매핑
  const aiVoices = ['daegil', 'flower', 'guri'];

  // 이미 사용된 카테고리 초기화
  useEffect(() => {
    const categories = [];
    if (ace !== 0) categories.push('ace');
    if (dual !== 0) categories.push('dual');
    if (triple !== 0) categories.push('triple');
    if (quad !== 0) categories.push('quad');
    if (penta !== 0) categories.push('penta');
    if (hexa !== 0) categories.push('hexa');
    if (chance !== 0) categories.push('chance');
    if (poker !== 0) categories.push('poker');
    if (fullHouse !== 0) categories.push('full_house');
    if (smallStraight !== 0) categories.push('small_straight');
    if (largeStraight !== 0) categories.push('large_straight');
    if (turkey !== 0) categories.push('turkey');
    
    setUsedCategories(categories);
  }, [ace, dual, triple, quad, penta, hexa, chance, poker, fullHouse, smallStraight, largeStraight, turkey]);

  // 리롤 버튼 클릭 처리
  const rerollButtonClick = () => {
    if(isGameOver) return;
    
    setSelectState('');
    setPreviewScores({});
    
    const ai = aiVoices[aiVoice - 1];
    const rerollFiles = 
      ai === 'daegil' ? scoreBoardSoundFiles.daegil.reroll :
      ai === 'flower' ? scoreBoardSoundFiles.flower.reroll : 
      scoreBoardSoundFiles.guri.reroll;
      
    const randomSound = rerollFiles[Math.floor(Math.random() * rerollFiles.length)];
    
    if(audioRef.current) {
      audioRef.current.src = randomSound;

      // 주사위 리롤 안내 음성 끝난후 주사위 새로 굴리기
      audioRef.current.onended = () => {
        throwDiceFunction();
      };

      audioRef.current.play().catch(e => {
        console.log("리롤 음성 재생 실패:", e);
        // 음성 재생 실패해도 주사위는 던지기
        throwDiceFunction();
      });
    } else {
      throwDiceFunction();
    }
  }

  // 점수 영역 선택 처리
  const selectScoreAreaClick = (category: string) => {
    if (usedCategories.includes(category)) return;

    if(audioRef.current) {
      audioRef.current.src = scoreButtonClickFile;
      audioRef.current.play().catch(e => console.log("점수 선택 음성 재생 실패:", e));
    }

    if (selectState === category) {
      setSelectState('');
      return;
    }
    
    setSelectState(category);
  }

  // 다음 턴 버튼 클릭 처리
  const selectScoreButtonClick = async () => {
    if(isGameOver || !selectState || !diceValue) return;

    try {
      // 점수 계산
      const scoreValue = previewScores[selectState] || 0;
      
      // 점수 선택 API 호출
      await selectScore(playerId, selectState, scoreValue);
      
      // 사용된 카테고리 추가
      setUsedCategories(prev => [...prev, selectState]);
      
      // 상태 초기화
      setRerollButtonState(true);
      setSelectState('');
      setPreviewScores({});
      
      // 효과음 재생
      if(audioRef.current) {
        audioRef.current.src = buttonClickFile;
        audioRef.current.play().catch(e => console.log("버튼 클릭 음성 재생 실패:", e));
      }
      
      // 다음 턴으로 넘어가기
      nextTurnButtonClick();
    } catch (error) {
      console.error("점수 선택 중 오류 발생:", error);
    }
  }

  // 내 턴일 때 음성 안내
  useEffect(() => {
    if (!gameStartFinished || !myTurn) return;
    if (isGameOver) return;

    const ai = aiVoices[aiVoice - 1];
    const myturnFiles = 
      ai === 'daegil' ? scoreBoardSoundFiles.daegil.myturn :
      ai === 'flower' ? scoreBoardSoundFiles.flower.myturn : 
      scoreBoardSoundFiles.guri.myturn;

    let randomSound: any[] = [];
    
    switch(playerId) {
      case 1:
        randomSound = myturnFiles[1] || [];
        break;
      case 2:
        randomSound = myturnFiles[2] || [];
        break;
      case 3:
        randomSound = myturnFiles[3] || [];
        break;
      case 4:
        randomSound = myturnFiles[4] || [];
        break;
    }

    if(audioRef.current && randomSound.length > 0) {
      audioRef.current.src = randomSound[Math.floor(Math.random() * randomSound.length)];
      audioRef.current.play().catch(e => console.log("내 턴 음성 재생 실패:", e));
    }
  }, [myTurn, gameStartFinished, isGameOver, aiVoice, playerId]);

  // 주사위 값이 변경될 때 점수 미리보기 업데이트
  useEffect(() => {
    if(!diceValue || !diceValue.dice_values) {
      setPreviewScores({});
      return;
    }
    
    try {
      const calculatedScores = calcYachtDice(diceValue.dice_values);
      setPreviewScores(calculatedScores);
      
      if(diceValue.rolls_left === 0) {
        setRerollButtonState(false);
        console.log("리롤 최대 횟수 달성 리롤 불가");
      } else {
        setRerollButtonState(true);
      }
    } catch (error) {
      console.error("점수 계산 중 오류:", error);
      setPreviewScores({});
    }
  }, [diceValue]);

  // 우승자 하이라이트 효과
  const isWinner = winnerPlayer === playerId;
  const cardStyle = isWinner ? {
    border: '3px solid gold',
    boxShadow: '0 0 20px gold',
    animation: 'winner-pulse 1.5s infinite alternate'
  } : myTurn ? {
    border: '3px solid #10FFFF',
    boxShadow: '0 0 15px #10FFFF'
  } : {};

  return (
    <div className={styles.scoreCardWrapper} style={cardStyle}>
      {/* 내 턴이 아닐 때 블락 처리 */}
      {!myTurn && <div className={styles.block}></div>}
      
      {/* 우승자 효과 */}
      {isWinner && <div className={styles.winnerblock}></div>}
      
      <img src={scoreCardBg} alt="Score Card Background" className={styles.backgroundImage} />
      
      <audio ref={audioRef}/>
      
      <div className={styles.scoreCardContent}>
        <div className={styles.header}>
          <h2 className={styles.title}>{playerName}</h2>
          <p className={styles.score}>SCORE: {score}</p>
        </div>
        
        <div className={styles.categoryContainer}>
          <ul className={styles.categoryList}>
            <li className={styles.categoryItem}>
              <span className={styles.categoryName}>에이스</span>
              <span 
                className={styles.categoryValue}
                onClick={() => myTurn && selectScoreAreaClick('ace')}
                style={{
                  fontWeight: selectState === 'ace' || usedCategories.includes('ace') ? 'bold' : 'normal',
                  textDecoration: usedCategories.includes('ace') ? 'underline' : 'none'
                }}
              >
                {
                  usedCategories.includes('ace') ? 
                  ace : 
                  Object.keys(previewScores).length !== 0 && myTurn ? previewScores.ace : ''
                }
              </span>
            </li>
            <li className={styles.categoryItem}>
              <span className={styles.categoryName}>듀얼</span>
              <span 
                className={styles.categoryValue}
                onClick={() => myTurn && selectScoreAreaClick('dual')}
                style={{
                  fontWeight: selectState === 'dual' || usedCategories.includes('dual') ? 'bold' : 'normal',
                  textDecoration: usedCategories.includes('dual') ? 'underline' : 'none'
                }}
              >
                {
                  usedCategories.includes('dual') ? 
                  dual : 
                  Object.keys(previewScores).length !== 0 && myTurn ? previewScores.dual : ''
                }
              </span>
            </li>
            <li className={styles.categoryItem}>
              <span className={styles.categoryName}>트리플</span>
              <span 
                className={styles.categoryValue}
                onClick={() => myTurn && selectScoreAreaClick('triple')}
                style={{
                  fontWeight: selectState === 'triple' || usedCategories.includes('triple') ? 'bold' : 'normal',
                  textDecoration: usedCategories.includes('triple') ? 'underline' : 'none'
                }}
              >
                {
                  usedCategories.includes('triple') ? 
                  triple : 
                  Object.keys(previewScores).length !== 0 && myTurn ? previewScores.triple : ''
                }
              </span>
            </li>
            <li className={styles.categoryItem}>
              <span className={styles.categoryName}>쿼드</span>
              <span 
                className={styles.categoryValue}
                onClick={() => myTurn && selectScoreAreaClick('quad')}
                style={{
                  fontWeight: selectState === 'quad' || usedCategories.includes('quad') ? 'bold' : 'normal',
                  textDecoration: usedCategories.includes('quad') ? 'underline' : 'none'
                }}
              >
                {
                  usedCategories.includes('quad') ? 
                  quad : 
                  Object.keys(previewScores).length !== 0 && myTurn ? previewScores.quad : ''
                }
              </span>
            </li>
            <li className={styles.categoryItem}>
              <span className={styles.categoryName}>펜타</span>
              <span 
                className={styles.categoryValue}
                onClick={() => myTurn && selectScoreAreaClick('penta')}
                style={{
                  fontWeight: selectState === 'penta' || usedCategories.includes('penta') ? 'bold' : 'normal',
                  textDecoration: usedCategories.includes('penta') ? 'underline' : 'none'
                }}
              >
                {
                  usedCategories.includes('penta') ? 
                  penta : 
                  Object.keys(previewScores).length !== 0 && myTurn ? previewScores.penta : ''
                }
              </span>
            </li>
            <li className={styles.categoryItem}>
              <span className={styles.categoryName}>헥사</span>
              <span 
                className={styles.categoryValue}
                onClick={() => myTurn && selectScoreAreaClick('hexa')}
                style={{
                  fontWeight: selectState === 'hexa' || usedCategories.includes('hexa') ? 'bold' : 'normal',
                  textDecoration: usedCategories.includes('hexa') ? 'underline' : 'none'
                }}
              >
                {
                  usedCategories.includes('hexa') ? 
                  hexa : 
                  Object.keys(previewScores).length !== 0 && myTurn ? previewScores.hexa : ''
                }
              </span>
            </li>
            <li className={styles.categoryItem}>
              <span className={styles.categoryName}>찬스</span>
              <span 
                className={styles.categoryValue}
                onClick={() => myTurn && selectScoreAreaClick('chance')}
                style={{
                  fontWeight: selectState === 'chance' || usedCategories.includes('chance') ? 'bold' : 'normal',
                  textDecoration: usedCategories.includes('chance') ? 'underline' : 'none'
                }}
              >
                {
                  usedCategories.includes('chance') ? 
                  chance : 
                  Object.keys(previewScores).length !== 0 && myTurn ? previewScores.chance : ''
                }
              </span>
            </li>
            <li className={styles.categoryItem}>
              <span className={styles.categoryName}>포커</span>
              <span 
                className={styles.categoryValue}
                onClick={() => myTurn && selectScoreAreaClick('poker')}
                style={{
                  fontWeight: selectState === 'poker' || usedCategories.includes('poker') ? 'bold' : 'normal',
                  textDecoration: usedCategories.includes('poker') ? 'underline' : 'none'
                }}
              >
                {
                  usedCategories.includes('poker') ? 
                  poker : 
                  Object.keys(previewScores).length !== 0 && myTurn ? previewScores.poker : ''
                }
              </span>
            </li>
            <li className={styles.categoryItem}>
              <span className={styles.categoryName}>풀하우스</span>
              <span 
                className={styles.categoryValue}
                onClick={() => myTurn && selectScoreAreaClick('full_house')}
                style={{
                  fontWeight: selectState === 'full_house' || usedCategories.includes('full_house') ? 'bold' : 'normal',
                  textDecoration: usedCategories.includes('full_house') ? 'underline' : 'none'
                }}
              >
                {
                  usedCategories.includes('full_house') ? 
                  fullHouse : 
                  Object.keys(previewScores).length !== 0 && myTurn ? previewScores.full_house : ''
                }
              </span>
            </li>
            <li className={styles.categoryItem}>
              <span className={styles.categoryName}>SS</span>
              <span 
                className={styles.categoryValue}
                onClick={() => myTurn && selectScoreAreaClick('small_straight')}
                style={{
                  fontWeight: selectState === 'small_straight' || usedCategories.includes('small_straight') ? 'bold' : 'normal',
                  textDecoration: usedCategories.includes('small_straight') ? 'underline' : 'none'
                }}
              >
                {
                  usedCategories.includes('small_straight') ? 
                  smallStraight : 
                  Object.keys(previewScores).length !== 0 && myTurn ? previewScores.small_straight : ''
                }
              </span>
            </li>
            <li className={styles.categoryItem}>
              <span className={styles.categoryName}>LS</span>
              <span 
                className={styles.categoryValue}
                onClick={() => myTurn && selectScoreAreaClick('large_straight')}
                style={{
                  fontWeight: selectState === 'large_straight' || usedCategories.includes('large_straight') ? 'bold' : 'normal',
                  textDecoration: usedCategories.includes('large_straight') ? 'underline' : 'none'
                }}
              >
                {
                  usedCategories.includes('large_straight') ? 
                  largeStraight : 
                  Object.keys(previewScores).length !== 0 && myTurn ? previewScores.large_straight : ''
                }
              </span>
            </li>
            <li className={styles.categoryItem}>
              <span className={styles.categoryName}>터키</span>
              <span 
                className={styles.categoryValue}
                onClick={() => myTurn && selectScoreAreaClick('turkey')}
                style={{
                  fontWeight: selectState === 'turkey' || usedCategories.includes('turkey') ? 'bold' : 'normal',
                  textDecoration: usedCategories.includes('turkey') ? 'underline' : 'none'
                }}
              >
                {
                  usedCategories.includes('turkey') ? 
                  turkey : 
                  Object.keys(previewScores).length !== 0 && myTurn ? previewScores.turkey : ''
                }
              </span>
            </li>
          </ul>
        </div>
        
        <div className={styles.buttonArea}>
          <button 
            className={styles.rerollButton}
            onClick={myTurn && rerollButtonState && !isGameOver ? rerollButtonClick : undefined}
            disabled={!rerollButtonState || !myTurn || isGameOver}
          >
            REROLL
          </button>
          <button
            className={styles.nextTurnButton}
            onClick={myTurn && selectState !== '' && !isGameOver ? selectScoreButtonClick : undefined}
            disabled={selectState === '' || !myTurn || isGameOver}
          >
            NEXT TURN
          </button>
        </div>
      </div>
    </div>
  );
}

export default TurkeyDiceScoreCard;

