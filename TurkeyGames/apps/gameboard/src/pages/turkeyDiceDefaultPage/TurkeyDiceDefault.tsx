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

interface propsType {
  gameId: number,
  people : number,
  voice : number
}

export default function TurkeyDiceDefault(props: propsType) {

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [state, setState] = useState<boolean>(false);
    // const [number, setNumber] = useState<number>(0);
  
    const nextTurnButtonClick = () => {
      setState(false);
    }
  
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
  const [areaPlayers, setAreaPlayers] = useState<(string | null)[]>([null, null, null, null]);
  // 현재까지 배정된 인원 수
  const [playerCount, setPlayerCount] = useState(0);
  // 게임 준비 완료 => 시작
  const [gameStarted, setGameStarted] = useState(false);

  const handleCellClick = (index: number) => {
    // 이미 자리 배정이 끝났거나, 해당 영역이 이미 선택된 경우 무시
    if (playerCount >= props.people || areaPlayers[index] !== null) return;

    const newAreaPlayers = [...areaPlayers];
    newAreaPlayers[index] = `Player${playerCount + 1}`;
    setAreaPlayers(newAreaPlayers);
    setPlayerCount(playerCount + 1);
  };

  // 인원수 다 채워지면 자동으로 게임 시작
  useEffect(() => {
  if (playerCount === props.people && audioRef.current) {
    const audioEl = audioRef.current;

    // 첫 번째 사운드 재생
    audioEl.src = gameStartFile;
    audioEl.play();

    // 첫 번째 사운드 재생이 끝난 후 두 번째 사운드 재생
    const handleEnded = () => {
      // 두 번째 사운드 설정
      if (props.voice === 1) {
        audioEl.src = daegilStartFile;
      } else if (props.voice === 2) {
        audioEl.src = flowerStartFile;
      } else if (props.voice === 3) {
        audioEl.src = guriStartFile;
      }

      audioEl.play();

      // 두 번째 사운드가 끝나면 더 이상 onended 실행 안 되도록 제거
      audioEl.onended = null;
    };

    // 첫 사운드가 끝나면 실행
      audioEl.onended = handleEnded;

      setGameStarted(true);
    }
  }, [playerCount, props.people, props.voice]);



  return (
    <div className={styles.layout}>
      <div className={styles.spinBox}>
       <SpinTurkey image={turkey} />
      </div>

      <audio ref={audioRef}/>

        <div className={styles.leftArea}>
          <div className={styles.cell} onClick={() => handleCellClick(0)}>
            {/* {areaPlayers[0] || 'Area 1'} */}
            <TurkeyDiceScoreCardV1
              playerId={1}
              myTurn={true}
              aiVoice={1}
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
          </div>
          <div className={styles.cell} onClick={() => handleCellClick(1)}>
            {/* {areaPlayers[1] || 'Area 2'} */}
            <TurkeyDiceScoreCardV1
              playerId={1}
              myTurn={false}
              aiVoice={1}
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
          </div>
        </div>
        
        <div className={styles.map}>
          <img src={turkeyDiceDefaultMap} alt="turkeyDice Map" />
        </div>

        <div className={styles.rightArea}>
          <div className={styles.cell} onClick={() => handleCellClick(2)}>
            {/* {areaPlayers[2] || 'Area 3'} */}
            <TurkeyDiceScoreCardV1
              playerId={1}
              myTurn={false}
              aiVoice={1}
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
          </div>
          <div className={styles.cell} onClick={() => handleCellClick(3)}>
            {/* {areaPlayers[3] || 'Area 4'} */}
            <TurkeyDiceScoreCardV1
              playerId={1}
              myTurn={false}
              aiVoice={1}
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
          </div>
        </div>
    </div>
  )
}