import React, { useEffect, useRef, useState } from 'react'
import turkey from '../../assets/images/turkey.png'
import turkeyDiceDefaultMap from '../../assets/images/turkey_default_map.png';
import styles from './TurkeyDiceDefault.module.css';
import SpinTurkey from '../../components/common/spinTurkey/SpinTurkey';
import gameStartFile from '../../assets/sound/default/start/start.mp3';
import TurkeyDiceScoreCardV1 from '../../components/turkeyDice/turkeyDiceScoreCardV1/TurkeyDiceScoreCardV1';
import buttonClickFile from '../../assets/sound/default/button/button.mp3';
import yachtService from '../../api/yachtService';
import { calcYachtDice, checkYachtDice } from '../../utils/checkYachtDice';
import { gameBoardSoundFiles } from '../../constant/soundFiles';
import { Socket } from 'socket.io-client';
import { effectMap, GameMode } from '../../components/turkeyDice/turkeyDiceEffect/effectMap';
import HeartEffectAnimation from '../../components/turkeyDice/turkeyDiceEffect/HeartEffectAnimation';
import ExplosionEffectAnimation from '../../components/turkeyDice/turkeyDiceEffect/ExplosionEffectAnimation';
import { useNavigate } from 'react-router-dom';
import turkeySoundFile from '../../assets/sound/turkey/turkey.mp3';


interface propsType {
  socket : Socket,
  gameId: number,
  people : number,
  voice : number
}

export default function TurkeyDiceDefault(props: propsType) {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 1) 최초 자리 안내 mp3 파일 실행
  useEffect(() => {
    console.log('최초 자리 안내 mp3 파일 실행');
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

  // 2) 자리 선택하기(인원수 만큼 할당)
  // 각 영역에 배정된 플레이어 이름 (null = 미배정)
  const [areaPlayers, setAreaPlayers] = useState<(number | null)[]>([null, null, null, null]);
  // 현재까지 배정된 인원 수
  const [playerCount, setPlayerCount] = useState(0);
  // 게임 준비 완료 => 시작
  const [gameStarted, setGameStarted] = useState(false);
  // 게임 준비 완료 후 시작 안내
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

  // 자리 선택 클릭 효과음
  const buttonOnClick = () => {
    if(audioRef.current && !gameStarted) {
      audioRef.current.src = buttonClickFile;
      audioRef.current.play();
    }
  }
  
  // 3) 게임 진행
  // 순서대로 턴을 관리하는 상태
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [turnCount, setTurnCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [diceValue, setDiceValue] = useState<object | undefined>();

  const [scoreData, setScoreData] = useState([]);
  const [winnerPlayer, setWinnerPlayer] = useState<number>(0);
  const [highLightVideo, setHighLightVideo] = useState<string>('');

  // 점수 조회 API
  const getScores = async() => {
    try {
      console.log("점수 조회 API 호출!!!");
      const gameId = props.gameId;
      const data = await yachtService.getScores(gameId.toString());
      setScoreData(data.scores);
      return data;
    } catch (error) {
      console.log('에러:', error);
    }
  }

  // 주사위 던지기 API
  const throwDices = async() => {
    try {
      console.log("주사위 던지기 API 호출!!!");
      const gameId = props.gameId;
      const data = await yachtService.rollDice(gameId.toString());
    } catch (error) {
      console.log('에러:', error);
    }
  }

  // 점수 선택 API
  const selectScore = async(playerId : number, category : string, value: number) => {
    try {
      console.log("점수 선택 API 호출!!!");
      const gameId = props.gameId;
      const data = await yachtService.selectScore(gameId.toString(), {player_id: playerId, category: category, value: value});
    } catch (error) {
      console.log('에러:', error);
    }
  }

  // 게임 종료 알리기
  const infoGameIsOver = async(gameId : number) => {
    try {
      const data = await yachtService.endGameNotice(gameId.toString());
      console.log(data);
    } catch (error) {
      console.log('에러:', error);
    }
  }

  // 우승자 하이라이트 영상 조회 API
  const getHighlight = async(gameId : number, playerId : number) => {
    try {
      const data = await yachtService.getHighlight(gameId.toString(), playerId.toString());
      console.log(data);
      setHighLightVideo(data.qr_code);

    } catch (error) {
      console.log('에러:', error);
    }
  }

  useEffect(() => {
    console.log(highLightVideo);
  }, [highLightVideo]);

  useEffect(() => {
    if (playerCount === props.people && audioRef.current) {
      const audio = audioRef.current;

      // 첫 번째 사운드 재생
      audio.src = gameStartFile;
      audio.play();

      // 첫 번째 사운드가 끝났을 때
      const handleFirstEnded = () => {
        // 두 번째 사운드 설정
        if (props.voice === 1) {
          audio.src = gameBoardSoundFiles.daegil.start;
        } else if (props.voice === 2) {
          audio.src = gameBoardSoundFiles.flower.start;
        } else if (props.voice === 3) {
          audio.src = gameBoardSoundFiles.guri.start;
        }

        audio.play();

        // 두 번째 사운드가 끝났을 때
        const handleSecondEnded = () => {
          setGameStartFinished(true); // 최종 작업 실행
          audio.onended = null; // 이벤트 제거
        };

        audio.onended = handleSecondEnded; // 두 번째 사운드 끝나면 실행
      };

      setGameStarted(true);
      // getScores();

      audio.onended = handleFirstEnded;
      throwDices();
    }
    
  }, [playerCount, props.people, props.voice]);

  // 버튼 클릭: 턴 증가 + 다음 플레이어
  const nextTurnButtonClick = () => {
    console.log('nextTurnButtonClick 버튼 클릭');
    const newTurn = turnCount + 1;
    const newRound = Math.floor(newTurn / playerCount) + 1;
    getScores();
    setDiceValue(undefined);

    if (newRound > 1) {
    console.log('게임종료!!!');
    // 게임 종료 알리기 API => 메세지 전송까지지
    infoGameIsOver(props.gameId);

    setIsGameOver(true);
    return; // 이후 로직 실행 안 함
    }

    setTurnCount(prev => prev + 1);
    setCurrentTurnIndex(prev => (prev + 1) % playerCount);
    throwDices();
  };

  useEffect(() => {
  if (!isGameOver) return;

  const calcWinner = async () => {
    try {
      getScores();
      const score = await getScores();
      const winner = score.scores.reduce((best, current) => {
        if (
          current.total_score > best.total_score || 
          (current.total_score === best.total_score && current.player_id < best.player_id)
        ) {
          return current;
        }
        return best;
      });

      // alert(`🎮 게임 종료! 우승자는 플레이어 ${winner.player_id}`);
      setWinnerPlayer(winner.player_id);
      getHighlight(props.gameId, winner.player_id);

      let soundFiles: string[] = [];

      if (audioRef.current) {
        // 우승자에 따라 해당 mp3 리스트 가져오기
        if (props.voice === 1) {
          soundFiles = gameBoardSoundFiles.daegil.winner[winner.player_id];
        } else if (props.voice === 2) {
          soundFiles = gameBoardSoundFiles.flower.winner[winner.player_id];
        } else if (props.voice === 3) {
          soundFiles = gameBoardSoundFiles.guri.winner[winner.player_id];
        }

        // 무작위 mp3 선택 후 재생
        const randomSound = soundFiles[Math.floor(Math.random() * soundFiles.length)];
        audioRef.current.pause();  // 이전 사운드 중지
        audioRef.current.currentTime = 0;
        audioRef.current.src = randomSound;
        audioRef.current.play();
      }

      } catch (error) {
        console.error('우승자 계산 오류:', error);
      }
    };

    calcWinner(); // 함수 실행
  }, [isGameOver]);

  useEffect(() => {
    console.log("round : " + round);
  }, [round])

  useEffect(() => {
    console.log("scoreData" + JSON.stringify(scoreData));
  }, [scoreData])

  useEffect(() => {
    // 게임 결과 팟지 하이라이트???
  }, [isGameOver])

  useEffect(() => {
    props.socket.on("dice_rolling", (data) => {
      console.log("주사위 굴리기: " + JSON.stringify(data));
      console.log("주사위 굴리기: " + data);
    });
    props.socket.on("dice_update", (data) => {
      console.log(typeof(data));
      console.log(data);
      setDiceValue(data)
      console.log("주사위 업데이트: " + JSON.stringify(data));
    });
  }, [props.socket])

  const [mode, setMode] = useState<GameMode| null>(null);
  const [EffectComponent, setEffectComponent] =
    useState<React.ComponentType | null>(null);

  const handleModeClick = (selectedMode: GameMode) => {
    setMode(selectedMode);
    const effects = effectMap[selectedMode];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
    setEffectComponent(() => randomEffect);
  };

  const [effectType, setEffectType] = useState<'heart' | 'explosion' | null>(null);

  const handleEffect = () => {
    if (effectType !== null) return;

    const randomEffect = Math.random() < 0.5 ? 'explosion' : 'explosion';
    setEffectType(randomEffect);

    const duration = 1000; // 애니메이션 길이에 맞게 조정
    setTimeout(() => setEffectType(null), duration);
  };

  useEffect(() => {
    console.log("diceValue : ", diceValue)
    if(diceValue === undefined) return;
      handleEffect();
      console.log('diceValue.coords : ', diceValue.coords);
      let soundFiles: string | any[] = [];
      if(diceValue.length === 0) return;
      // 주사위 조합(poker, fh, ss, ls, turkey) 확인
      console.log('checkYachtDice(diceValue.dice_values)', checkYachtDice(diceValue.dice_values));
      switch(checkYachtDice(diceValue.dice_values)) {
        case "poker":
          if (props.voice === 1) {
            soundFiles = gameBoardSoundFiles.daegil.poker;
          } else if (props.voice === 2) {
            soundFiles = gameBoardSoundFiles.flower.poker;
          } else if (props.voice === 3) {
            soundFiles = gameBoardSoundFiles.guri.poker
          }
          break;
        case "fh":
          if (props.voice === 1) {
            soundFiles = gameBoardSoundFiles.daegil.fh;
          } else if (props.voice === 2) {
            soundFiles = gameBoardSoundFiles.flower.fh;
          } else if (props.voice === 3) {
            soundFiles = gameBoardSoundFiles.guri.fh
          }
          break;
        case "ss":
          if (props.voice === 1) {
            soundFiles = gameBoardSoundFiles.daegil.ss;
          } else if (props.voice === 2) {
            soundFiles = gameBoardSoundFiles.flower.ss;
          } else if (props.voice === 3) {
            soundFiles = gameBoardSoundFiles.guri.ss
          }
          break;
        case "ls":
          if (props.voice === 1) {
            soundFiles = gameBoardSoundFiles.daegil.ls;
          } else if (props.voice === 2) {
            soundFiles = gameBoardSoundFiles.flower.ls;
          } else if (props.voice === 3) {
            soundFiles = gameBoardSoundFiles.guri.ls
          }
          break;
        case "turkey":
          if (props.voice === 1) {
            soundFiles = gameBoardSoundFiles.daegil.turkey;
          } else if (props.voice === 2) {
            soundFiles = gameBoardSoundFiles.flower.turkey;
          } else if (props.voice === 3) {
            soundFiles = gameBoardSoundFiles.guri.turkey
          }
          break;
      }

      // if (audioRef.current && soundFiles.length > 0 && checkYachtDice(diceValue.dice_values) === 'turkey') {
      //       // 1. 먼저 재생할 공통 사운드 (예: roll.mp3)
      //       const preSound = new Audio(`${turkeySoundFile}`);
      //       preSound.play();

      //       // 2. preSound 재생이 끝난 후 원하는 사운드 재생
      //       preSound.onended = () => {
      //         const randomSound = soundFiles[Math.floor(Math.random() * soundFiles.length)];
      //         audioRef.current!.src = randomSound;
      //         audioRef.current!.play();
      //         audioRef.current = null;
      //       };
      // }

      if (audioRef.current) {
        const randomSound = soundFiles[Math.floor(Math.random() * soundFiles.length)];
        // audioRef.current.src = randomSound;
        // audioRef.current.play();
              setTimeout(() => {
          audioRef.current!.src = randomSound;
          audioRef.current!.play();
        }, 3000); // 3000ms = 3초
      }
  }, [diceValue])

  return (
    <div className={styles.layout}>
      <audio ref={audioRef}/>
      <div className={styles.leftArea}>
        <div className={styles.cell} onClick={() => handleCellClick(0)}>
          {!gameStarted ? (
            <div className={styles.seat}>
              {areaPlayers[0] == null ? '자리를 선택해주세요!' : `Player${areaPlayers[0]} 준비완료!`}
            </div>
          ) : (
            areaPlayers[0] == null 
              ? <></> 
              : <TurkeyDiceScoreCardV1
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
                  totalScore={scoreData[areaPlayers[0] - 1]?.total_score ?? 0}
                  diceValue={diceValue}
                  isGameOver={isGameOver}
                  winnerPlayer={winnerPlayer}
                  nextTurnButtonClick={nextTurnButtonClick}
                  throwDiceFunction={throwDices}
                  selectScore={selectScore}
                />
          )}
          {/* {areaPlayers[0] || 'Area 1'} */}
          
        </div>
        <div className={styles.cell} onClick={() => handleCellClick(1)}>
          {/* {areaPlayers[1] || 'Area 2'} */}
          {!gameStarted ? (
            <div className={styles.seat} onClick={buttonOnClick}>
              {areaPlayers[1] == null ? '자리를 선택해주세요!' : `Player${areaPlayers[1]} 준비완료!`}
            </div>
          ) : (
            areaPlayers[1] == null 
              ? <></> 
              : <TurkeyDiceScoreCardV1
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
                  totalScore={scoreData[areaPlayers[1] - 1]?.total_score ?? 0}
                  diceValue={diceValue}
                  isGameOver={isGameOver}
                  winnerPlayer={winnerPlayer}
                  nextTurnButtonClick={nextTurnButtonClick}
                  throwDiceFunction={throwDices}
                  selectScore={selectScore}
                />
          )}
        </div>
      </div>
        
      <div className={styles.map}>
        <img src={turkeyDiceDefaultMap} alt="turkeyDice Map" />
        {/* {effectType === 'heart' && <HeartEffectAnimation coords={diceValue.coords}  />} */}
        {effectType === 'explosion' && <ExplosionEffectAnimation coords={diceValue.coords} />}
        {highLightVideo !== '' ? <div className={styles.highlight}><video muted autoPlay src={highLightVideo} /></div> : <></>}
      </div>
      <div className={styles.rightArea}>
        
        <div className={styles.cell} onClick={() => handleCellClick(2)}>
          {/* {areaPlayers[2] || 'Area 3'} */}
          {!gameStarted ? (
            <div className={styles.seat} onClick={buttonOnClick}>
              {areaPlayers[2] == null ? '자리를 선택해주세요!' : `Player${areaPlayers[2]} 준비완료!`}
            </div>
          ) : (
            areaPlayers[2] == null 
              ? <></> 
              : <TurkeyDiceScoreCardV1
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
                  totalScore={scoreData[areaPlayers[2] - 1]?.total_score ?? 0}
                  diceValue={diceValue}
                  isGameOver={isGameOver}
                  winnerPlayer={winnerPlayer}
                  nextTurnButtonClick={nextTurnButtonClick}
                  throwDiceFunction={throwDices}
                  selectScore={selectScore}
                />
          )}
        </div>
        <div className={styles.cell} onClick={() => handleCellClick(3)}>
          {/* {areaPlayers[3] || 'Area 4'} */}
          {!gameStarted ? (
            <div className={styles.seat} onClick={buttonOnClick}>
              {areaPlayers[3] == null ? '자리를 선택해주세요!' : `Player${areaPlayers[3]} 준비완료!`}
            </div>
          ) : (
            areaPlayers[3] == null 
              ? <></> 
              : <TurkeyDiceScoreCardV1
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
                  totalScore={scoreData[areaPlayers[3] - 1]?.total_score ?? 0}
                  diceValue={diceValue}
                  isGameOver={isGameOver}
                  winnerPlayer={winnerPlayer}
                  nextTurnButtonClick={nextTurnButtonClick}
                  throwDiceFunction={throwDices}
                  selectScore={selectScore}
                />
          )}
        </div>
      </div>
    </div>
  )
}