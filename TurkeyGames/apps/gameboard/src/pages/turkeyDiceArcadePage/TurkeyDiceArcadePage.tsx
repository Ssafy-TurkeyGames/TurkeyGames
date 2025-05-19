// src/pages/turkeyDiceAcadePage/TurkeyDiceAcadePage.jsx
import React, { useEffect, useRef, useState } from 'react';
import styles from './TurkeyDiceArcadePage.module.css';
import ArcadeMap from '../../assets/images/turkey_acade_map.png';
import ArcadeScoreCard from '../../components/turkeyDice/Arcade/TurkeyDiceScoreCard';
import buttonClickFile from '../../assets/sound/default/button/button.mp3';
import gameStartFile from '../../assets/sound/default/start/start.mp3';
import backgroundSound from '../../assets/sound/arcade/background.mp3';
import yachtService from '../../api/yachtService';
import { gameBoardSoundFiles } from '../../constant/soundFiles';
import { checkYachtDice } from '../../utils/checkYachtDice';

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
        audioRef.current.src = gameBoardSoundFiles.daegil.seat;
        audioRef.current.play();
      } else if (props.voice === 2) {
        audioRef.current.src = gameBoardSoundFiles.flower.seat;
        audioRef.current.play();
      } else if (props.voice === 3) {
        audioRef.current.src = gameBoardSoundFiles.guri.seat;
        audioRef.current.play();
      }
    }
  }, []);

  // 자리 선택하기(인원수 만큼 할당)
  const [areaPlayers, setAreaPlayers] = useState<(number | null)[]>([null, null, null, null]);
  const [playerCount, setPlayerCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameStartFinished, setGameStartFinished] = useState(false);
  const [diceValue, setDiceValue] = useState<any>(undefined);

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
          audioEl.src = gameBoardSoundFiles.daegil.start;
        } else if (props.voice === 2) {
          audioEl.src = gameBoardSoundFiles.flower.start;
        } else if (props.voice === 3) {
          audioEl.src = gameBoardSoundFiles.guri.start;
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

  // 점수 조회 API
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

  // 주사위 던지기 API
  const throwDices = async() => {
    try {
      console.log("주사위 던지기 API 호출!!!");
      const gameId = props.gameId;
      const data = await yachtService.rollDice(gameId.toString(), {keep_indices: []});
      console.log('주사위 데이터:', data);
      setDiceValue(data);

      let soundFiles: any[] = [];

      // 주사위 조합(poker, fh, ss, ls, turkey) 확인
      const diceCombo = checkYachtDice(data.dice_values);
      if (diceCombo) {
        if (props.voice === 1) {
          soundFiles = gameBoardSoundFiles.daegil[diceCombo];
        } else if (props.voice === 2) {
          soundFiles = gameBoardSoundFiles.flower[diceCombo];
        } else if (props.voice === 3) {
          soundFiles = gameBoardSoundFiles.guri[diceCombo];
        }

        if (audioRef.current && soundFiles.length > 0) {
          const randomSound = soundFiles[Math.floor(Math.random() * soundFiles.length)];
          audioRef.current.src = randomSound;
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.log('에러:', error);
    }
  }

  // 점수 선택 API
  const selectScore = async(playerId: number, category: string, value: number) => {
    try {
      const gameId = props.gameId;
      const data = await yachtService.selectScore(gameId.toString(), {
        player_id: playerId, 
        category: category, 
        value: value
      });
      console.log('점수 선택 결과:', data);
    } catch (error) {
      console.log('에러:', error);
    }
  }

  // 버튼 클릭: 턴 증가 + 다음 플레이어
  const nextTurnButtonClick = () => {
    setTurnCount(prev => prev + 1);
    setCurrentTurnIndex(prev => (prev + 1) % playerCount);
    setDiceValue(undefined);
    getScores();
  };

  // turnCount가 바뀔 때마다 round 갱신
  useEffect(() => {
    const newRound = Math.floor(turnCount / playerCount) + 1;

    // 최대 12라운드까지만
    if (newRound <= 12) {
      setRound(newRound);
    }

    if (newRound > 12) {
      setIsGameOver(true);
    }
  }, [turnCount, playerCount]);

  // 게임 종료 시 승자 결정 및 음성 재생
  useEffect(() => {
    if (!isGameOver || scoreData.length === 0) return;

    // 승자 결정 (점수가 가장 높은 플레이어)
    const winner = scoreData.reduce((best: any, current: any) => {
      if (
        current.total_score > best.total_score || 
        (current.total_score === best.total_score && current.player_id < best.player_id)
      ) {
        return current;
      }
      return best;
    }, scoreData[0]);

    alert(`🎮 게임 종료! Player ${winner.player_id}의 승리!`);

    let soundFiles: any[] = [];

    if (audioRef.current) {
      if (props.voice === 1) {
        soundFiles = gameBoardSoundFiles.daegil.winner[winner.player_id];
      } else if (props.voice === 2) {
        soundFiles = gameBoardSoundFiles.flower.winner[winner.player_id];
      } else if (props.voice === 3) {
        soundFiles = gameBoardSoundFiles.guri.winner[winner.player_id];
      }

      if (soundFiles && soundFiles.length > 0) {
        const randomSound = soundFiles[Math.floor(Math.random() * soundFiles.length)];
        audioRef.current.src = randomSound;
        audioRef.current.play();
      }
    }
  }, [isGameOver, scoreData, props.voice]);

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
                  diceValue={diceValue}
                  isGameOver={isGameOver}
                  nextTurnButtonClick={nextTurnButtonClick}
                  throwDiceFunction={throwDices}
                  selectScore={selectScore}
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
                  diceValue={diceValue}
                  isGameOver={isGameOver}
                  nextTurnButtonClick={nextTurnButtonClick}
                  throwDiceFunction={throwDices}
                  selectScore={selectScore}
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
                  diceValue={diceValue}
                  isGameOver={isGameOver}
                  nextTurnButtonClick={nextTurnButtonClick}
                  throwDiceFunction={throwDices}
                  selectScore={selectScore}
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
                  diceValue={diceValue}
                  isGameOver={isGameOver}
                  nextTurnButtonClick={nextTurnButtonClick}
                  throwDiceFunction={throwDices}
                  selectScore={selectScore}
                />
          )}
        </div>
      </div>
    </div>
  );
}
