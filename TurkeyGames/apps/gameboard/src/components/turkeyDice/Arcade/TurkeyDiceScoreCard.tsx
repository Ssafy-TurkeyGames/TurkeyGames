// src/components/turkeyDice/Arcade/TurkeyDiceScoreCard.tsx
import React, { useEffect, useRef } from 'react';
import styles from './TurkeyDiceScoreCard.module.css';
import scoreCardBg from '../../../assets/images/turkey_arcade_score_resize.png';

// 대길 리롤 음성
import daegilRerollFile1 from '../../../assets/sound/daegil/reroll/reroll_v1.mp3';
import daegilRerollFile2 from '../../../assets/sound/daegil/reroll/reroll_v2.mp3';
import daegilRerollFile3 from '../../../assets/sound/daegil/reroll/reroll_v3.mp3';
// 플라워 리롤 음성
import flowerRerollFile1 from '../../../assets/sound/flower/reroll/reroll_v1.mp3';
import flowerRerollFile2 from '../../../assets/sound/flower/reroll/reroll_v2.mp3';
import flowerRerollFile3 from '../../../assets/sound/flower/reroll/reroll_v3.mp3';
// 구리 리롤 음성
import guriRerollFile1 from '../../../assets/sound/guri/reroll/reroll_v3.mp3';
import guriRerollFile2 from '../../../assets/sound/guri/reroll/reroll_v3.mp3';
import guriRerollFile3 from '../../../assets/sound/guri/reroll/reroll_v3.mp3';

// 대길 마이턴 음성
import daegilMyturnPlayer1V1 from '../../../assets/sound/daegil/myturn/player1_v1.mp3';
import daegilMyturnPlayer1V2 from '../../../assets/sound/daegil/myturn/player1_v2.mp3';
import daegilMyturnPlayer1V3 from '../../../assets/sound/daegil/myturn/player1_v3.mp3';
import daegilMyturnPlayer2V1 from '../../../assets/sound/daegil/myturn/player2_v1.mp3';
import daegilMyturnPlayer2V2 from '../../../assets/sound/daegil/myturn/player2_v2.mp3';
import daegilMyturnPlayer2V3 from '../../../assets/sound/daegil/myturn/player2_v3.mp3';
import daegilMyturnPlayer3V1 from '../../../assets/sound/daegil/myturn/player3_v1.mp3';
import daegilMyturnPlayer3V2 from '../../../assets/sound/daegil/myturn/player3_v2.mp3';
import daegilMyturnPlayer3V3 from '../../../assets/sound/daegil/myturn/player3_v3.mp3';
import daegilMyturnPlayer4V1 from '../../../assets/sound/daegil/myturn/player4_v1.mp3';
import daegilMyturnPlayer4V2 from '../../../assets/sound/daegil/myturn/player4_v2.mp3';
import daegilMyturnPlayer4V3 from '../../../assets/sound/daegil/myturn/player4_v3.mp3';

// 플라워 마이턴 음성
import flowerMyturnPlayer1V1 from '../../../assets/sound/flower/myturn/player1_v1.mp3';
import flowerMyturnPlayer1V2 from '../../../assets/sound/flower/myturn/player1_v2.mp3';
import flowerMyturnPlayer1V3 from '../../../assets/sound/flower/myturn/player1_v3.mp3';
import flowerMyturnPlayer2V1 from '../../../assets/sound/flower/myturn/player2_v1.mp3';
import flowerMyturnPlayer2V2 from '../../../assets/sound/flower/myturn/player2_v2.mp3';
import flowerMyturnPlayer2V3 from '../../../assets/sound/flower/myturn/player2_v3.mp3';
import flowerMyturnPlayer3V1 from '../../../assets/sound/flower/myturn/player3_v1.mp3';
import flowerMyturnPlayer3V2 from '../../../assets/sound/flower/myturn/player3_v2.mp3';
import flowerMyturnPlayer3V3 from '../../../assets/sound/flower/myturn/player3_v3.mp3';
import flowerMyturnPlayer4V1 from '../../../assets/sound/flower/myturn/player4_v1.mp3';
import flowerMyturnPlayer4V2 from '../../../assets/sound/flower/myturn/player4_v2.mp3';
import flowerMyturnPlayer4V3 from '../../../assets/sound/flower/myturn/player4_v3.mp3';

// 구리 마이턴 음성
import guriMyturnPlayer1V1 from '../../../assets/sound/guri/myturn/player1_v1.mp3';
import guriMyturnPlayer1V2 from '../../../assets/sound/guri/myturn/player1_v2.mp3';
import guriMyturnPlayer1V3 from '../../../assets/sound/guri/myturn/player1_v3.mp3';
import guriMyturnPlayer2V1 from '../../../assets/sound/guri/myturn/player2_v1.mp3';
import guriMyturnPlayer2V2 from '../../../assets/sound/guri/myturn/player2_v2.mp3';
import guriMyturnPlayer2V3 from '../../../assets/sound/guri/myturn/player2_v3.mp3';
import guriMyturnPlayer3V1 from '../../../assets/sound/guri/myturn/player3_v1.mp3';
import guriMyturnPlayer3V2 from '../../../assets/sound/guri/myturn/player3_v2.mp3';
import guriMyturnPlayer3V3 from '../../../assets/sound/guri/myturn/player3_v3.mp3';
import guriMyturnPlayer4V1 from '../../../assets/sound/guri/myturn/player4_v1.mp3';
import guriMyturnPlayer4V2 from '../../../assets/sound/guri/myturn/player4_v2.mp3';
import guriMyturnPlayer4V3 from '../../../assets/sound/guri/myturn/player4_v3.mp3';

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
  nextTurnButtonClick?: () => void;
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
  nextTurnButtonClick
}) => {
  // 현재 턴인 플레이어의 카드에 하이라이트 효과 추가
  const cardStyle = myTurn ? {
    border: '3px solid gold',
    boxShadow: '0 0 20px gold'
  } : {};

  // 총점 계산
  const totalScore = ace + dual + triple + quad + penta + hexa + chance + poker + fullHouse + smallStraight + largeStraight + turkey;

  // 오디오 요소에 대한 참조 생성
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 리롤 사운드 파일 배열
  const rerollSoundFiles = aiVoice === 1 ? [daegilRerollFile1, daegilRerollFile2, daegilRerollFile3]
                     : aiVoice === 2 ? [flowerRerollFile1, flowerRerollFile2, flowerRerollFile3]
                     : [guriRerollFile1, guriRerollFile2, guriRerollFile3];

  // reroll 버튼 클릭 핸들러
  const handleRerollClick = () => {
    if (!myTurn) return;
    
    const randomSound = rerollSoundFiles[Math.floor(Math.random() * rerollSoundFiles.length)];
    if (audioRef.current) {
      audioRef.current.src = randomSound;
      audioRef.current.play();
    }
  };

  // 턴이 변경될 때 음성 재생
  useEffect(() => {
    if (!gameStartFinished || !myTurn) return;
    
    let randomSoundFiles: any[] = [];
    
    if (myTurn) {
      if (aiVoice === 1) {
        if (playerId === 1) {
          randomSoundFiles = [daegilMyturnPlayer1V1, daegilMyturnPlayer1V2, daegilMyturnPlayer1V3];
        } else if (playerId === 2) {
          randomSoundFiles = [daegilMyturnPlayer2V1, daegilMyturnPlayer2V2, daegilMyturnPlayer2V3];
        } else if (playerId === 3) {
          randomSoundFiles = [daegilMyturnPlayer3V1, daegilMyturnPlayer3V2, daegilMyturnPlayer3V3];
        } else if (playerId === 4) {
          randomSoundFiles = [daegilMyturnPlayer4V1, daegilMyturnPlayer4V2, daegilMyturnPlayer4V3];
        }
      } else if (aiVoice === 2) {
        if (playerId === 1) {
          randomSoundFiles = [flowerMyturnPlayer1V1, flowerMyturnPlayer1V2, flowerMyturnPlayer1V3];
        } else if (playerId === 2) {
          randomSoundFiles = [flowerMyturnPlayer2V1, flowerMyturnPlayer2V2, flowerMyturnPlayer2V3];
        } else if (playerId === 3) {
          randomSoundFiles = [flowerMyturnPlayer3V1, flowerMyturnPlayer3V2, flowerMyturnPlayer3V3];
        } else if (playerId === 4) {
          randomSoundFiles = [flowerMyturnPlayer4V1, flowerMyturnPlayer4V2, flowerMyturnPlayer4V3];
        }
      } else if (aiVoice === 3) {
        if (playerId === 1) {
          randomSoundFiles = [guriMyturnPlayer1V1, guriMyturnPlayer1V2, guriMyturnPlayer1V3];
        } else if (playerId === 2) {
          randomSoundFiles = [guriMyturnPlayer2V1, guriMyturnPlayer2V2, guriMyturnPlayer2V3];
        } else if (playerId === 3) {
          randomSoundFiles = [guriMyturnPlayer3V1, guriMyturnPlayer3V2, guriMyturnPlayer3V3];
        } else if (playerId === 4) {
          randomSoundFiles = [guriMyturnPlayer4V1, guriMyturnPlayer4V2, guriMyturnPlayer4V3];
        }
      }
    }
    
    const randomSound = randomSoundFiles[Math.floor(Math.random() * 3)];
    if (audioRef.current) {
      audioRef.current.src = randomSound;
      audioRef.current.play();
    }
  }, [myTurn, gameStartFinished, aiVoice, playerId]);

  return (
    <div className={styles.scoreCardWrapper} style={cardStyle}>
      {!myTurn && <div className={styles.block}></div>}
      <img src={scoreCardBg} alt="Score Card Background" className={styles.backgroundImage} />
      <div className={styles.scoreCardContent}>
        <div className={styles.header}>
          <h1 className={styles.title}>{playerName}</h1>
          <div className={styles.score}>SCORE {totalScore}</div>
        </div>
        
        <div className={styles.categoryContainer}>
          <div className={styles.divider}></div>
          <div className={styles.categoryList}>
            <div className={styles.categoryItem}>
              <span className={styles.categoryName}>에이스</span>
              <span className={styles.categoryValue}>{ace}</span>
            </div>
            <div className={styles.categoryItem}>
              <span className={styles.categoryName}>듀얼</span>
              <span className={styles.categoryValue}>{dual}</span>
            </div>
            <div className={styles.categoryItem}>
              <span className={styles.categoryName}>트리플</span>
              <span className={styles.categoryValue}>{triple}</span>
            </div>
            <div className={styles.categoryItem}>
              <span className={styles.categoryName}>쿼드</span>
              <span className={styles.categoryValue}>{quad}</span>
            </div>
            <div className={styles.categoryItem}>
              <span className={styles.categoryName}>펜타</span>
              <span className={styles.categoryValue}>{penta}</span>
            </div>
            <div className={styles.categoryItem}>
              <span className={styles.categoryName}>헥사</span>
              <span className={styles.categoryValue}>{hexa}</span>
            </div>
            <div className={styles.categoryItem}>
              <span className={styles.categoryName}>포커</span>
              <span className={styles.categoryValue}>{poker}</span>
            </div>
            <div className={styles.categoryItem}>
              <span className={styles.categoryName}>풀하우스</span>
              <span className={styles.categoryValue}>{fullHouse}</span>
            </div>
            <div className={styles.categoryItem}>
              <span className={styles.categoryName}>S.S</span>
              <span className={styles.categoryValue}>{smallStraight}</span>
            </div>
            <div className={styles.categoryItem}>
              <span className={styles.categoryName}>L.S</span>
              <span className={styles.categoryValue}>{largeStraight}</span>
            </div>
            <div className={styles.categoryItem}>
              <span className={styles.categoryName}>터키</span>
              <span className={styles.categoryValue}>{turkey}</span>
            </div>
            <div className={styles.categoryItem}>
              <span className={styles.categoryName}>찬스</span>
              <span className={styles.categoryValue}>{chance}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.buttonArea}>
          <button 
            className={styles.rerollButton} 
            disabled={!myTurn}
            onClick={handleRerollClick}
          >
            REROLL
          </button>
          <button 
            className={styles.nextTurnButton} 
            disabled={!myTurn}
            onClick={nextTurnButtonClick}
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
