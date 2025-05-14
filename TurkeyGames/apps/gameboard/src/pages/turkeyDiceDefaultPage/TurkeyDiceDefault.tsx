import React, { useEffect, useRef, useState } from 'react'
import turkey from '../../assets/images/turkey.png'
import turkeyDiceDefaultMap from '../../assets/images/turkey_default_map.png';
import styles from './TurkeyDiceDefault.module.css';
import SpinTurkey from '../../components/common/spinTurkey/SpinTurkey';
import daegilSeatFile from '../../assets/sound/daegil/seat/seat.mp3';
import flowerSeatFile from '../../assets/sound/flower/seat/seat.mp3';
import guriSeatFile from '../../assets/sound/guri/seat/seat.mp3';
import daegilStartFile from '../../assets/sound/daegil/start/start.mp3';
import flowerStartFile from '../../assets/sound/flower/start/start.mp3';
import guriStartFile from '../../assets/sound/guri/start/start.mp3';
import gameStartFile from '../../assets/sound/default/start/start.mp3';
import TurkeyDiceScoreCardV1 from '../../components/turkeyDice/turkeyDiceScoreCardV1/TurkeyDiceScoreCardV1';
import buttonClickFile from '../../assets/sound/default/button/button.mp3';
import yachtService from '../../api/yachtService';


interface propsType {
  gameId: number,
  people : number,
  voice : number
}

export default function TurkeyDiceDefault(props: propsType) {

  const audioRef = useRef<HTMLAudioElement | null>(null);

  
  // 1) 최초 자리 안내 mp3 파일 실행
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
        setGameStartFinished(true); // ✅ 최종 작업 실행
        audioEl.onended = null; // 이벤트 제거
      };

      audioEl.onended = handleSecondEnded; // 두 번째 사운드 끝나면 실행
    };

    setGameStarted(true);

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

  // 3) 게임 진행
  // 순서대로 턴을 관리하는 상태
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [turnCount, setTurnCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const getScores = async() => {
    try {
      const gameId = props.gameId;
      const data = await yachtService.getScores(gameId.toString());
      console.log('데이터:', data);
    } catch (error) {
      
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
    // 필요 시: 게임 종료 상태 설정 등도 가능
    setIsGameOver(true);
  }
    
  }, [turnCount, playerCount]);

  useEffect(() => {
    console.log("round : " + round);
    getScores();
  }, [round])

  useEffect(() => {
    // 게임 결과 팟지 하이라이트???
  }, [isGameOver])
  
  
  

  return (
    <div className={styles.layout}>
      <div className={styles.spinBox}>
       <SpinTurkey image={turkey} />
      </div>

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
                    ace={1}
                    dual={2}
                    triple={3}
                    quad={4}
                    penta={5}
                    hexa={6}
                    chance={7}
                    poker={8}
                    fullHouse={9}
                    smallStraight={10}
                    largeStraight={10}
                    turkey={10}
                    nextTurnButtonClick={nextTurnButtonClick}
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
                    ace={1}
                    dual={2}
                    triple={3}
                    quad={4}
                    penta={5}
                    hexa={6}
                    chance={7}
                    poker={8}
                    fullHouse={9}
                    smallStraight={10}
                    largeStraight={10}
                    turkey={10}
                    nextTurnButtonClick={nextTurnButtonClick}
                  />
            )}
          </div>
        </div>
        
        <div className={styles.map}>
          <img src={turkeyDiceDefaultMap} alt="turkeyDice Map" />
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
                    ace={1}
                    dual={2}
                    triple={3}
                    quad={4}
                    penta={5}
                    hexa={6}
                    chance={7}
                    poker={8}
                    fullHouse={9}
                    smallStraight={10}
                    largeStraight={10}
                    turkey={10}
                    nextTurnButtonClick={nextTurnButtonClick}
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
                    ace={1}
                    dual={2}
                    triple={3}
                    quad={4}
                    penta={5}
                    hexa={6}
                    chance={7}
                    poker={8}
                    fullHouse={9}
                    smallStraight={10}
                    largeStraight={10}
                    turkey={10}
                    nextTurnButtonClick={nextTurnButtonClick}
                  />
            )}
          </div>
        </div>
    </div>
  )
}