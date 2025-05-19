// src/pages/turkeyDiceAcadePage/TurkeyDiceAcadePage.jsx
import React, { useEffect, useRef, useState } from 'react';
import styles from './TurkeyDiceArcadePage.module.css';
import ArcadeMap from '../../assets/images/turkey_acade_map.png';
import ArcadeScoreCard from '../../components/turkeyDice/Arcade/TurkeyDiceScoreCard';
import buttonClickFile from '../../assets/sound/default/button/button.mp3';
import gameStartFile from '../../assets/sound/default/start/start.mp3';
import daegilSeatFile from '../../assets/sound/daegil/seat/seat.mp3';
import flowerSeatFile from '../../assets/sound/flower/seat/seat.mp3';
import guriSeatFile from '../../assets/sound/guri/seat/seat.mp3';
import daegilStartFile from '../../assets/sound/daegil/start/start.mp3';
import flowerStartFile from '../../assets/sound/flower/start/start.mp3';
import guriStartFile from '../../assets/sound/guri/start/start.mp3';
import backgroundSound from '../../assets/sound/arcade/background.mp3';
import yachtService from '../../api/yachtService';

interface propsType {
  gameId: number,
  people: number,
  voice: number
}

export default function TurkeyDiceAcadePage(props: propsType) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // 배경음악 재생
  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.src = backgroundSound;
      bgMusicRef.current.loop = true; // 반복 재생
      bgMusicRef.current.volume = 0.5; // 볼륨 50%
      bgMusicRef.current.play();
    }
  }, []);
  
  // 최초 자리 안내 mp3 파일 실행
  useEffect(() => {
    if (audioRef.current) {
      if (props.voice === 1) {
        audioRef.current.src = daegilSeatFile;
        audioRef.current.play();
      } else if (props.voice === 2) {
        audioRef.current.src = flowerSeatFile;
        audioRef.current.play();
      } else if (props.voice === 3) {
        audioRef.current.src = guriSeatFile;
        audioRef.current.play();
      }
    }
  }, []);

  // 자리 선택하기(인원수 만큼 할당)
  const [areaPlayers, setAreaPlayers] = useState<(number | null)[]>([null, null, null, null]);
  const [playerCount, setPlayerCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameStartFinished, setGameStartFinished] = useState(false);

  const handleCellClick = (index: number) => {
    // 이미 자리 배정이 끝났거나, 해당 영역이 이미 선택된 경우 무시
    if (playerCount >= props.people || areaPlayers[index] !== null) return;

    const newAreaPlayers = [...areaPlayers];
    newAreaPlayers[index] = playerCount + 1;
    setAreaPlayers(newAreaPlayers);
    setPlayerCount(playerCount + 1);

    buttonOnClick();
  };

  useEffect(() => {
    if (playerCount === props.people && audioRef.current) {
      const audioEl = audioRef.current;

      // 첫 번째 사운드 재생
      audioEl.src = gameStartFile;
      audioEl.play();

      // 첫 번째 사운드가 끝났을 때
      const handleFirstEnded = () => {
        // 두 번째 사운드 설정
        if (props.voice === 1) {
          audioEl.src = daegilStartFile;
        } else if (props.voice === 2) {
          audioEl.src = flowerStartFile;
        } else if (props.voice === 3) {
          audioEl.src = guriStartFile;
        }

        audioEl.play();

        // 두 번째 사운드가 끝났을 때
        const handleSecondEnded = () => {
          setGameStartFinished(true);
          audioEl.onended = null; // 이벤트 제거
        };

        audioEl.onended = handleSecondEnded;
      };

      setGameStarted(true);
      getScores();

      audioEl.onended = handleFirstEnded;
    }
  }, [playerCount, props.people, props.voice]);

  // 자리 선택 클릭 효과음
  const buttonOnClick = () => {
    if(audioRef.current && !gameStarted) {
      audioRef.current.src = buttonClickFile;
      audioRef.current.play();
    }
  }

  // 게임 진행
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [turnCount, setTurnCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [scoreData, setScoreData] = useState([]);

  const getScores = async() => {
    try {
      const gameId = props.gameId;
      const data = await yachtService.getScores(gameId.toString());
      setScoreData(data.scores);
      console.log('데이터:', data);
    } catch (error) {
      console.log('에러:', error);
    }
  }

  // 버튼 클릭: 턴 증가 + 다음 플레이어
  const nextTurnButtonClick = () => {
    setTurnCount(prev => prev + 1);
    setCurrentTurnIndex(prev => (prev + 1) % playerCount);
  };

  // turnCount가 바뀔 때마다 round 갱신
  useEffect(() => {
    const newRound = Math.floor(turnCount / playerCount) + 1;

    // 최대 12라운드까지만
    if (newRound <= 12) {
      setRound(newRound);
    }

    if (newRound > 12) {
      alert("🎮 게임 종료!");
      setIsGameOver(true);
    }
  }, [turnCount, playerCount]);

  return (
    <div className={styles.container}>
      <audio ref={audioRef}/>
      <audio ref={bgMusicRef}/>
      <div className={styles.CardContainer}>
        <div className={`${styles.upside} ${areaPlayers[0] === null ? styles.emptyArea : ''}`} onClick={() => handleCellClick(0)}>
          {!gameStarted ? (
            <div className={`${styles.seat} ${areaPlayers[0] !== null ? styles.ready : ''}`}>
              {areaPlayers[0] === null ? '자리를 선택해주세요!' : `Player ${areaPlayers[0]} 준비완료!`}
            </div>
          ) : (
            areaPlayers[0] === null 
              ? <></> 
              : <ArcadeScoreCard 
                  playerName={`Player ${areaPlayers[0]}`}
                  playerId={areaPlayers[0]}
                  score={
                    (scoreData[areaPlayers[0] - 1]?.scorecard.ace ?? 0) +
                    (scoreData[areaPlayers[0] - 1]?.scorecard.dual ?? 0) +
                    (scoreData[areaPlayers[0] - 1]?.scorecard.triple ?? 0) +
                    (scoreData[areaPlayers[0] - 1]?.scorecard.quad ?? 0) +
                    (scoreData[areaPlayers[0] - 1]?.scorecard.penta ?? 0) +
                    (scoreData[areaPlayers[0] - 1]?.scorecard.hexa ?? 0) +
                    (scoreData[areaPlayers[0] - 1]?.scorecard.chance ?? 0) +
                    (scoreData[areaPlayers[0] - 1]?.scorecard.poker ?? 0) +
                    (scoreData[areaPlayers[0] - 1]?.scorecard.full_house ?? 0) +
                    (scoreData[areaPlayers[0] - 1]?.scorecard.small_straight ?? 0) +
                    (scoreData[areaPlayers[0] - 1]?.scorecard.large_straight ?? 0) +
                    (scoreData[areaPlayers[0] - 1]?.scorecard.turkey ?? 0)
                  }
                  myTurn={areaPlayers[0] === currentTurnIndex + 1}
                  aiVoice={props.voice}
                  gameStartFinished={gameStartFinished}
                  ace={scoreData[areaPlayers[0] - 1]?.scorecard.ace ?? 0}
                  dual={scoreData[areaPlayers[0] - 1]?.scorecard.dual ?? 0}
                  triple={scoreData[areaPlayers[0] - 1]?.scorecard.triple ?? 0}
                  quad={scoreData[areaPlayers[0] - 1]?.scorecard.quad ?? 0}
                  penta={scoreData[areaPlayers[0] - 1]?.scorecard.penta ?? 0}
                  hexa={scoreData[areaPlayers[0] - 1]?.scorecard.hexa ?? 0}
                  chance={scoreData[areaPlayers[0] - 1]?.scorecard.chance ?? 0}
                  poker={scoreData[areaPlayers[0] - 1]?.scorecard.poker ?? 0}
                  fullHouse={scoreData[areaPlayers[0] - 1]?.scorecard.full_house ?? 0}
                  smallStraight={scoreData[areaPlayers[0] - 1]?.scorecard.small_straight ?? 0}
                  largeStraight={scoreData[areaPlayers[0] - 1]?.scorecard.large_straight ?? 0}
                  turkey={scoreData[areaPlayers[0] - 1]?.scorecard.turkey ?? 0}
                  nextTurnButtonClick={nextTurnButtonClick}
                />
          )}
        </div>
        <div className={`${styles.downside} ${areaPlayers[1] === null ? styles.emptyArea : ''}`} onClick={() => handleCellClick(1)}>
          {!gameStarted ? (
            <div className={`${styles.seat} ${areaPlayers[1] !== null ? styles.ready : ''}`}>
              {areaPlayers[1] === null ? '자리를 선택해주세요!' : `Player ${areaPlayers[1]} 준비완료!`}
            </div>
          ) : (
            areaPlayers[1] === null 
              ? <></> 
              : <ArcadeScoreCard 
                  playerName={`Player ${areaPlayers[1]}`}
                  playerId={areaPlayers[1]}
                  score={
                    (scoreData[areaPlayers[1] - 1]?.scorecard.ace ?? 0) +
                    (scoreData[areaPlayers[1] - 1]?.scorecard.dual ?? 0) +
                    (scoreData[areaPlayers[1] - 1]?.scorecard.triple ?? 0) +
                    (scoreData[areaPlayers[1] - 1]?.scorecard.quad ?? 0) +
                    (scoreData[areaPlayers[1] - 1]?.scorecard.penta ?? 0) +
                    (scoreData[areaPlayers[1] - 1]?.scorecard.hexa ?? 0) +
                    (scoreData[areaPlayers[1] - 1]?.scorecard.chance ?? 0) +
                    (scoreData[areaPlayers[1] - 1]?.scorecard.poker ?? 0) +
                    (scoreData[areaPlayers[1] - 1]?.scorecard.full_house ?? 0) +
                    (scoreData[areaPlayers[1] - 1]?.scorecard.small_straight ?? 0) +
                    (scoreData[areaPlayers[1] - 1]?.scorecard.large_straight ?? 0) +
                    (scoreData[areaPlayers[1] - 1]?.scorecard.turkey ?? 0)
                  }
                  myTurn={areaPlayers[1] === currentTurnIndex + 1}
                  aiVoice={props.voice}
                  gameStartFinished={gameStartFinished}
                  ace={scoreData[areaPlayers[1] - 1]?.scorecard.ace ?? 0}
                  dual={scoreData[areaPlayers[1] - 1]?.scorecard.dual ?? 0}
                  triple={scoreData[areaPlayers[1] - 1]?.scorecard.triple ?? 0}
                  quad={scoreData[areaPlayers[1] - 1]?.scorecard.quad ?? 0}
                  penta={scoreData[areaPlayers[1] - 1]?.scorecard.penta ?? 0}
                  hexa={scoreData[areaPlayers[1] - 1]?.scorecard.hexa ?? 0}
                  chance={scoreData[areaPlayers[1] - 1]?.scorecard.chance ?? 0}
                  poker={scoreData[areaPlayers[1] - 1]?.scorecard.poker ?? 0}
                  fullHouse={scoreData[areaPlayers[1] - 1]?.scorecard.full_house ?? 0}
                  smallStraight={scoreData[areaPlayers[1] - 1]?.scorecard.small_straight ?? 0}
                  largeStraight={scoreData[areaPlayers[1] - 1]?.scorecard.large_straight ?? 0}
                  turkey={scoreData[areaPlayers[1] - 1]?.scorecard.turkey ?? 0}
                  nextTurnButtonClick={nextTurnButtonClick}
                />
          )}
        </div>
      </div>
      
      <div className={styles.centerMap}>
        <img src={ArcadeMap} alt="game map" />
      </div>
      
      <div className={styles.CardContainer}>
        <div className={`${styles.upside} ${areaPlayers[2] === null ? styles.emptyArea : ''}`} onClick={() => handleCellClick(2)}>
          {!gameStarted ? (
            <div className={`${styles.seat} ${areaPlayers[2] !== null ? styles.ready : ''}`}>
              {areaPlayers[2] === null ? '자리를 선택해주세요!' : `Player ${areaPlayers[2]} 준비완료!`}
            </div>
          ) : (
            areaPlayers[2] === null 
              ? <></> 
              : <ArcadeScoreCard 
                  playerName={`Player ${areaPlayers[2]}`}
                  playerId={areaPlayers[2]}
                  score={
                    (scoreData[areaPlayers[2] - 1]?.scorecard.ace ?? 0) +
                    (scoreData[areaPlayers[2] - 1]?.scorecard.dual ?? 0) +
                    (scoreData[areaPlayers[2] - 1]?.scorecard.triple ?? 0) +
                    (scoreData[areaPlayers[2] - 1]?.scorecard.quad ?? 0) +
                    (scoreData[areaPlayers[2] - 1]?.scorecard.penta ?? 0) +
                    (scoreData[areaPlayers[2] - 1]?.scorecard.hexa ?? 0) +
                    (scoreData[areaPlayers[2] - 1]?.scorecard.chance ?? 0) +
                    (scoreData[areaPlayers[2] - 1]?.scorecard.poker ?? 0) +
                    (scoreData[areaPlayers[2] - 1]?.scorecard.full_house ?? 0) +
                    (scoreData[areaPlayers[2] - 1]?.scorecard.small_straight ?? 0) +
                    (scoreData[areaPlayers[2] - 1]?.scorecard.large_straight ?? 0) +
                    (scoreData[areaPlayers[2] - 1]?.scorecard.turkey ?? 0)
                  }
                  myTurn={areaPlayers[2] === currentTurnIndex + 1}
                  aiVoice={props.voice}
                  gameStartFinished={gameStartFinished}
                  ace={scoreData[areaPlayers[2] - 1]?.scorecard.ace ?? 0}
                  dual={scoreData[areaPlayers[2] - 1]?.scorecard.dual ?? 0}
                  triple={scoreData[areaPlayers[2] - 1]?.scorecard.triple ?? 0}
                  quad={scoreData[areaPlayers[2] - 1]?.scorecard.quad ?? 0}
                  penta={scoreData[areaPlayers[2] - 1]?.scorecard.penta ?? 0}
                  hexa={scoreData[areaPlayers[2] - 1]?.scorecard.hexa ?? 0}
                  chance={scoreData[areaPlayers[2] - 1]?.scorecard.chance ?? 0}
                  poker={scoreData[areaPlayers[2] - 1]?.scorecard.poker ?? 0}
                  fullHouse={scoreData[areaPlayers[2] - 1]?.scorecard.full_house ?? 0}
                  smallStraight={scoreData[areaPlayers[2] - 1]?.scorecard.small_straight ?? 0}
                  largeStraight={scoreData[areaPlayers[2] - 1]?.scorecard.large_straight ?? 0}
                  turkey={scoreData[areaPlayers[2] - 1]?.scorecard.turkey ?? 0}
                  nextTurnButtonClick={nextTurnButtonClick}
                />
          )}
        </div>
        <div className={`${styles.downside} ${areaPlayers[3] === null ? styles.emptyArea : ''}`} onClick={() => handleCellClick(3)}>
          {!gameStarted ? (
            <div className={`${styles.seat} ${areaPlayers[3] !== null ? styles.ready : ''}`}>
              {areaPlayers[3] === null ? '자리를 선택해주세요!' : `Player ${areaPlayers[3]} 준비완료!`}
            </div>
          ) : (
            areaPlayers[3] === null 
              ? <></> 
              : <ArcadeScoreCard 
                  playerName={`Player ${areaPlayers[3]}`}
                  playerId={areaPlayers[3]}
                  score={
                    (scoreData[areaPlayers[3] - 1]?.scorecard.ace ?? 0) +
                    (scoreData[areaPlayers[3] - 1]?.scorecard.dual ?? 0) +
                    (scoreData[areaPlayers[3] - 1]?.scorecard.triple ?? 0) +
                    (scoreData[areaPlayers[3] - 1]?.scorecard.quad ?? 0) +
                    (scoreData[areaPlayers[3] - 1]?.scorecard.penta ?? 0) +
                    (scoreData[areaPlayers[3] - 1]?.scorecard.hexa ?? 0) +
                    (scoreData[areaPlayers[3] - 1]?.scorecard.chance ?? 0) +
                    (scoreData[areaPlayers[3] - 1]?.scorecard.poker ?? 0) +
                    (scoreData[areaPlayers[3] - 1]?.scorecard.full_house ?? 0) +
                    (scoreData[areaPlayers[3] - 1]?.scorecard.small_straight ?? 0) +
                    (scoreData[areaPlayers[3] - 1]?.scorecard.large_straight ?? 0) +
                    (scoreData[areaPlayers[3] - 1]?.scorecard.turkey ?? 0)
                  }
                  myTurn={areaPlayers[3] === currentTurnIndex + 1}
                  aiVoice={props.voice}
                  gameStartFinished={gameStartFinished}
                  ace={scoreData[areaPlayers[3] - 1]?.scorecard.ace ?? 0}
                  dual={scoreData[areaPlayers[3] - 1]?.scorecard.dual ?? 0}
                  triple={scoreData[areaPlayers[3] - 1]?.scorecard.triple ?? 0}
                  quad={scoreData[areaPlayers[3] - 1]?.scorecard.quad ?? 0}
                  penta={scoreData[areaPlayers[3] - 1]?.scorecard.penta ?? 0}
                  hexa={scoreData[areaPlayers[3] - 1]?.scorecard.hexa ?? 0}
                  chance={scoreData[areaPlayers[3] - 1]?.scorecard.chance ?? 0}
                  poker={scoreData[areaPlayers[3] - 1]?.scorecard.poker ?? 0}
                  fullHouse={scoreData[areaPlayers[3] - 1]?.scorecard.full_house ?? 0}
                  smallStraight={scoreData[areaPlayers[3] - 1]?.scorecard.small_straight ?? 0}
                  largeStraight={scoreData[areaPlayers[3] - 1]?.scorecard.large_straight ?? 0}
                  turkey={scoreData[areaPlayers[3] - 1]?.scorecard.turkey ?? 0}
                  nextTurnButtonClick={nextTurnButtonClick}
                />
          )}
        </div>
      </div>
    </div>
  );
}
