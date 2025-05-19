// src/pages/turkeyDiceArcadePage/TurkeyDiceArcadePage.tsx
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
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';

interface propsType {
  socket: Socket,
  gameId: number,
  people: number,
  voice: number
}

export default function TurkeyDiceArcadePage(props: propsType) {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const [audioInitialized, setAudioInitialized] = useState(false);

  // 자리 선택하기(인원수 만큼 할당)
  const [areaPlayers, setAreaPlayers] = useState<(number | null)[]>([null, null, null, null]);
  const [playerCount, setPlayerCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameStartFinished, setGameStartFinished] = useState(false);

  // 게임 진행
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [turnCount, setTurnCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [diceValue, setDiceValue] = useState<any>(undefined);
  const [scoreData, setScoreData] = useState<any[]>([]);
  const [winnerPlayer, setWinnerPlayer] = useState<number>(0);
  const [socketConnected, setSocketConnected] = useState(false);

  // 사용자 상호작용 후 오디오 초기화
  const initializeAudio = () => {
    if (audioInitialized) return;
    
    if (bgMusicRef.current) {
      bgMusicRef.current.src = backgroundSound;
      bgMusicRef.current.loop = true;
      bgMusicRef.current.volume = 0.5;
      
      // 사용자 상호작용으로 오디오 재생 시도
      const playPromise = bgMusicRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("배경음악 재생 성공");
            setAudioInitialized(true);
          })
          .catch(e => {
            console.log("배경음악 자동재생 실패:", e);
          });
      }
    }
    
    // 최초 자리 안내 음성 준비
    if (audioRef.current && props.voice) {
      if (props.voice === 1) {
        audioRef.current.src = gameBoardSoundFiles.daegil.seat;
      } else if (props.voice === 2) {
        audioRef.current.src = gameBoardSoundFiles.flower.seat;
      } else if (props.voice === 3) {
        audioRef.current.src = gameBoardSoundFiles.guri.seat;
      }
      
      audioRef.current.play()
        .then(() => {
          console.log("음성 재생 성공");
        })
        .catch(e => {
          console.log("음성 자동재생 실패:", e);
        });
    }
  };

  // 사용자 상호작용 이벤트 리스너
  useEffect(() => {
    const handleUserInteraction = () => {
      initializeAudio();
    };
    
    // 클릭 이벤트에 오디오 초기화 함수 연결
    document.addEventListener('click', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  // 컴포넌트 언마운트 시 배경음악 정지
  useEffect(() => {
    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
      }
    };
  }, []);

  // 자리 선택 클릭 처리
  const handleCellClick = (index: number) => {
    if (playerCount >= props.people || areaPlayers[index] !== null) return;

    const newAreaPlayers = [...areaPlayers];
    newAreaPlayers[index] = playerCount + 1;
    setAreaPlayers(newAreaPlayers);
    setPlayerCount(playerCount + 1);

    buttonOnClick();
  };

  // 자리 선택 완료 시 게임 시작
  useEffect(() => {
    if (playerCount === props.people && audioRef.current) {
      const audioEl = audioRef.current;

      // 첫 번째 사운드 재생
      audioEl.src = gameStartFile;
      
      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // 첫 번째 사운드가 끝났을 때
            audioEl.onended = () => {
              // 두 번째 사운드 설정
              if (props.voice === 1) {
                audioEl.src = gameBoardSoundFiles.daegil.start;
              } else if (props.voice === 2) {
                audioEl.src = gameBoardSoundFiles.flower.start;
              } else if (props.voice === 3) {
                audioEl.src = gameBoardSoundFiles.guri.start;
              }

              audioEl.play()
                .then(() => {
                  // 두 번째 사운드가 끝났을 때
                  audioEl.onended = () => {
                    setGameStartFinished(true);
                    audioEl.onended = null;
                  };
                })
                .catch(e => console.log("음성 재생 실패:", e));
            };
          })
          .catch(e => console.log("게임 시작 음성 재생 실패:", e));
      }

      setGameStarted(true);
      getScores();
      throwDices(); // 게임 시작 시 주사위 던지기 API 호출
    }
  }, [playerCount, props.people, props.voice]);

  // 자리 선택 클릭 효과음
  const buttonOnClick = () => {
    if(audioRef.current && !gameStarted) {
      audioRef.current.src = buttonClickFile;
      audioRef.current.play().catch(e => console.log("버튼 클릭 음성 재생 실패:", e));
    }
  }

  // 점수 데이터 가져오기
  const getScores = async() => {
    try {
      const gameId = props.gameId;
      const data = await yachtService.getScores(gameId.toString());
      console.log('점수 데이터:', data);
      
      if (data && data.scores) {
        setScoreData(data.scores);
        return data;
      }
    } catch (error) {
      console.log('점수 데이터 조회 오류:', error);
    }
    return null;
  }

  // 주사위 던지기 API
  const throwDices = async() => {
    try {
      console.log("주사위 던지기 API 호출");
      const gameId = props.gameId;
      await yachtService.rollDice(gameId.toString());
      // 주사위 값은 웹소켓 이벤트로 받아옴
    } catch (error) {
      console.log('주사위 던지기 오류:', error);
    }
  }

  // 점수 선택 API
  const selectScore = async(playerId: number, category: string, value: number) => {
    try {
      console.log("점수 선택 API 호출:", playerId, category, value);
      const gameId = props.gameId;
      const data = await yachtService.selectScore(gameId.toString(), {
        player_id: playerId, 
        category: category, 
        value: value
      });
      console.log('점수 선택 응답:', data);
      
      // 점수 선택 후 게임 참가 이벤트 발송 (대시보드에 점수 업데이트 알림)
      if (props.socket && socketConnected) {
        props.socket.emit('join_game', { gameId: props.gameId });
        console.log('게임 참가 이벤트 발송 (점수 업데이트 알림)');
      }
      
      return data;
    } catch (error) {
      console.log('점수 선택 오류:', error);
    }
  }

  // 우승자 하이라이트 영상 조회 API
  const getHighlight = async(gameId: number, playerId: number) => {
    try {
      const data = await yachtService.getHighlight(gameId.toString(), playerId.toString());
      console.log('하이라이트 데이터:', data);
    } catch (error) {
      console.log('하이라이트 조회 오류:', error);
    }
  }

  // 버튼 클릭: 턴 증가 + 다음 플레이어
const nextTurnButtonClick = async () => {
  const newTurn = turnCount + 1;
  const newRound = Math.floor(newTurn / props.people) + 1;

  if (newRound > 1) {
    console.log('게임종료!!!');
    setIsGameOver(true);
    return;
  }

  setTurnCount(prev => prev + 1);
  setCurrentTurnIndex(prev => (prev + 1) % props.people);
  setDiceValue(undefined);

  setTimeout(async () => {
    await getScores();
    await throwDices();

    // 한 라운드가 끝난 경우에만 score_update emit
    if ((newTurn) % props.people === 0) {
      const latestScores = await getScores();
      if (props.socket && socketConnected && latestScores && latestScores.scores) {
        props.socket.emit('score_update', { scores: latestScores.scores });
        console.log('한 라운드 종료 후 score_update emit');
      }
    }
  }, 500);
};

  // turnCount가 바뀔 때마다 round 갱신
  useEffect(() => {
    const newRound = Math.floor(turnCount / props.people) + 1;

    // 최대 12라운드까지만
    if (newRound <= 12) {
      setRound(newRound);
    }

    // 12라운드 초과 시 게임 종료
    if (newRound > 12) {
      setIsGameOver(true);
    }
  }, [turnCount, props.people]);

  // 게임 종료 시 우승자 결정
useEffect(() => {
  if (!isGameOver) return;

  const calcWinner = async () => {
    try {
      const score = await getScores();
      if (!score || !score.scores || score.scores.length === 0) return;
      
      const winner = score.scores.reduce((best, current) => {
        if (
          current.total_score > best.total_score || 
          (current.total_score === best.total_score && current.player_id < best.player_id)
        ) {
          return current;
        }
        return best;
      }, score.scores[0]);

      console.log("우승자 결정:", winner);
      alert(`🎮 게임 종료! 우승자는 플레이어 ${winner.player_id}`);
      setWinnerPlayer(winner.player_id);
      getHighlight(props.gameId, winner.player_id);

      // 소켓을 통해 게임 종료 이벤트 발송
      if (props.socket && socketConnected) {
        props.socket.emit('game_ended', { 
          gameId: props.gameId,
          winner: winner.player_id,
          scores: score.scores
        });
        console.log('게임 종료 이벤트 발송:', props.gameId);
      }

      if (audioRef.current) {
        let soundFiles: string[] = [];
        
        // 우승자에 따라 해당 mp3 리스트 가져오기
        if (props.voice === 1 && gameBoardSoundFiles.daegil.winner[winner.player_id]) {
          soundFiles = gameBoardSoundFiles.daegil.winner[winner.player_id];
        } else if (props.voice === 2 && gameBoardSoundFiles.flower.winner[winner.player_id]) {
          soundFiles = gameBoardSoundFiles.flower.winner[winner.player_id];
        } else if (props.voice === 3 && gameBoardSoundFiles.guri.winner[winner.player_id]) {
          soundFiles = gameBoardSoundFiles.guri.winner[winner.player_id];
        } else {
          // 해당 플레이어 ID에 대한 음성 파일이 없는 경우 기본 음성 사용
          if (props.voice === 1) {
            soundFiles = gameBoardSoundFiles.daegil.winner[1] || [];
          } else if (props.voice === 2) {
            soundFiles = gameBoardSoundFiles.flower.winner[1] || [];
          } else if (props.voice === 3) {
            soundFiles = gameBoardSoundFiles.guri.winner[1] || [];
          }
        }

        // 음성 파일이 있는 경우에만 재생
        if (soundFiles && soundFiles.length > 0) {
          const randomSound = soundFiles[Math.floor(Math.random() * soundFiles.length)];
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.src = randomSound;
          audioRef.current.play().catch(e => console.log("우승자 음성 재생 실패:", e));
        } else {
          console.log("우승자 음성 파일을 찾을 수 없습니다.");
          // 음성 파일이 없는 경우 일정 시간 후 홈 화면으로 이동
          setTimeout(() => {
            navigate('/gameboard/');
          }, 3000);
        }
      } else {
        // 오디오 참조가 없는 경우 일정 시간 후 홈 화면으로 이동
        setTimeout(() => {
          navigate('/gameboard/');
        }, 3000);
      }
    } catch (error) {
      console.error('우승자 계산 오류:', error);
      // 오류 발생 시에도 일정 시간 후 홈 화면으로 이동
      setTimeout(() => {
        navigate('/gameboard/');
      }, 3000);
    }
  };

  calcWinner();
}, [isGameOver, props.gameId, props.voice, props.socket, socketConnected, navigate]);


  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!props.socket) {
      console.warn('소켓 연결이 없습니다. 일부 기능이 작동하지 않을 수 있습니다.');
      return;
    }

    // 소켓 연결 상태 확인
    props.socket.on("connect", () => {
      console.log("소켓 연결됨");
      setSocketConnected(true);
      
      // 연결 시 게임 참가 이벤트 발송
      props.socket.emit('join_game', { gameId: props.gameId });
      console.log('게임 참가 이벤트 발송, gameId:', props.gameId);
    });

    props.socket.on("disconnect", () => {
      console.log("소켓 연결 끊김");
      setSocketConnected(false);
    });

    // 주사위 굴리기 이벤트 - 카메라가 주사위를 인식하기 시작했음을 알림
    props.socket.on("dice_rolling", (data) => {
      console.log("주사위 굴리기: " + JSON.stringify(data));
    });
    
    // 주사위 업데이트 이벤트 - 카메라가 인식한 주사위 값 전달
    props.socket.on("dice_update", (data) => {
      console.log("주사위 업데이트: " + JSON.stringify(data));
      if (data && data.dice_values) {
        setDiceValue(data);
      }
    });
    
    // 점수 업데이트 이벤트 - 대시보드와 동일한 이벤트 수신
    props.socket.on("score_update", (data) => {
      console.log("점수 업데이트 이벤트:", data);
      if (data && data.scores) {
        setScoreData(data.scores);
      }
    });
    
    // 게임 상태 변경 이벤트
    props.socket.on("game_status", (data) => {
      console.log("게임 상태 변경 이벤트:", data);
      if (data && data.status === 'ended') {
        setIsGameOver(true);
      }
    });
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      props.socket.off("connect");
      props.socket.off("disconnect");
      props.socket.off("dice_rolling");
      props.socket.off("dice_update");
      props.socket.off("score_update");
      props.socket.off("game_status");
      
      // 게임 퇴장
      props.socket.emit('leave_game', { gameId: props.gameId });
      console.log('게임 퇴장 이벤트 발송, gameId:', props.gameId);
    };
  }, [props.socket, props.gameId]);

  // 주사위 값이 변경될 때 주사위 조합에 따른 음성 재생
  useEffect(() => {
    console.log("diceValue 변경:", diceValue);
    if (!diceValue || !diceValue.dice_values || diceValue.dice_values.length === 0) return;
    
    let soundFiles: string[] = [];
    
    // 주사위 조합(poker, fh, ss, ls, turkey) 확인
    const diceCombo = checkYachtDice(diceValue.dice_values);
    if (!diceCombo) return;
    
    switch(diceCombo) {
      case "poker":
        if (props.voice === 1) {
          soundFiles = gameBoardSoundFiles.daegil.poker;
        } else if (props.voice === 2) {
          soundFiles = gameBoardSoundFiles.flower.poker;
        } else if (props.voice === 3) {
          soundFiles = gameBoardSoundFiles.guri.poker;
        }
        break;
      case "fh":
        if (props.voice === 1) {
          soundFiles = gameBoardSoundFiles.daegil.fh;
        } else if (props.voice === 2) {
          soundFiles = gameBoardSoundFiles.flower.fh;
        } else if (props.voice === 3) {
          soundFiles = gameBoardSoundFiles.guri.fh;
        }
        break;
      case "ss":
        if (props.voice === 1) {
          soundFiles = gameBoardSoundFiles.daegil.ss;
        } else if (props.voice === 2) {
          soundFiles = gameBoardSoundFiles.flower.ss;
        } else if (props.voice === 3) {
          soundFiles = gameBoardSoundFiles.guri.ss;
        }
        break;
      case "ls":
        if (props.voice === 1) {
          soundFiles = gameBoardSoundFiles.daegil.ls;
        } else if (props.voice === 2) {
          soundFiles = gameBoardSoundFiles.flower.ls;
        } else if (props.voice === 3) {
          soundFiles = gameBoardSoundFiles.guri.ls;
        }
        break;
      case "turkey":
        if (props.voice === 1) {
          soundFiles = gameBoardSoundFiles.daegil.turkey;
        } else if (props.voice === 2) {
          soundFiles = gameBoardSoundFiles.flower.turkey;
        } else if (props.voice === 3) {
          soundFiles = gameBoardSoundFiles.guri.turkey;
        }
        break;
    }

    if (audioRef.current && soundFiles.length > 0) {
      const randomSound = soundFiles[Math.floor(Math.random() * soundFiles.length)];
      audioRef.current.src = randomSound;
      audioRef.current.play().catch(e => console.log("주사위 조합 음성 재생 실패:", e));
    }
  }, [diceValue, props.voice]);

  return (
    <div className={styles.container}>
      <audio ref={audioRef}/>
      <audio ref={bgMusicRef}/>
      
      {/* 라운드 표시 */}
      {gameStarted && (
        <div className={styles.roundInfo}>
          Round: {round}/12
        </div>
      )}
      
      {/* 소켓 상태 표시 (개발용) */}
      <div className={styles.socketStatus} style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        color: socketConnected ? 'green' : 'red',
        zIndex: 1000
      }}>
        {socketConnected ? '🟢 연결됨' : '🔴 연결 끊김'}
      </div>
      
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
                  score={scoreData[areaPlayers[0] - 1]?.total_score || 0}
                  myTurn={areaPlayers[0] === currentTurnIndex + 1}
                  aiVoice={props.voice}
                  gameStartFinished={gameStartFinished}
                  ace={scoreData[areaPlayers[0] - 1]?.scorecard?.ace ?? 0}
                  dual={scoreData[areaPlayers[0] - 1]?.scorecard?.dual ?? 0}
                  triple={scoreData[areaPlayers[0] - 1]?.scorecard?.triple ?? 0}
                  quad={scoreData[areaPlayers[0] - 1]?.scorecard?.quad ?? 0}
                  penta={scoreData[areaPlayers[0] - 1]?.scorecard?.penta ?? 0}
                  hexa={scoreData[areaPlayers[0] - 1]?.scorecard?.hexa ?? 0}
                  chance={scoreData[areaPlayers[0] - 1]?.scorecard?.chance ?? 0}
                  poker={scoreData[areaPlayers[0] - 1]?.scorecard?.poker ?? 0}
                  fullHouse={scoreData[areaPlayers[0] - 1]?.scorecard?.full_house ?? 0}
                  smallStraight={scoreData[areaPlayers[0] - 1]?.scorecard?.small_straight ?? 0}
                  largeStraight={scoreData[areaPlayers[0] - 1]?.scorecard?.large_straight ?? 0}
                  turkey={scoreData[areaPlayers[0] - 1]?.scorecard?.turkey ?? 0}
                  diceValue={diceValue}
                  isGameOver={isGameOver}
                  winnerPlayer={winnerPlayer}
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
                  score={scoreData[areaPlayers[1] - 1]?.total_score || 0}
                  myTurn={areaPlayers[1] === currentTurnIndex + 1}
                  aiVoice={props.voice}
                  gameStartFinished={gameStartFinished}
                  ace={scoreData[areaPlayers[1] - 1]?.scorecard?.ace ?? 0}
                  dual={scoreData[areaPlayers[1] - 1]?.scorecard?.dual ?? 0}
                  triple={scoreData[areaPlayers[1] - 1]?.scorecard?.triple ?? 0}
                  quad={scoreData[areaPlayers[1] - 1]?.scorecard?.quad ?? 0}
                  penta={scoreData[areaPlayers[1] - 1]?.scorecard?.penta ?? 0}
                  hexa={scoreData[areaPlayers[1] - 1]?.scorecard?.hexa ?? 0}
                  chance={scoreData[areaPlayers[1] - 1]?.scorecard?.chance ?? 0}
                  poker={scoreData[areaPlayers[1] - 1]?.scorecard?.poker ?? 0}
                  fullHouse={scoreData[areaPlayers[1] - 1]?.scorecard?.full_house ?? 0}
                  smallStraight={scoreData[areaPlayers[1] - 1]?.scorecard?.small_straight ?? 0}
                  largeStraight={scoreData[areaPlayers[1] - 1]?.scorecard?.large_straight ?? 0}
                  turkey={scoreData[areaPlayers[1] - 1]?.scorecard?.turkey ?? 0}
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
                  score={scoreData[areaPlayers[2] - 1]?.total_score || 0}
                  myTurn={areaPlayers[2] === currentTurnIndex + 1}
                  aiVoice={props.voice}
                  gameStartFinished={gameStartFinished}
                  ace={scoreData[areaPlayers[2] - 1]?.scorecard?.ace ?? 0}
                  dual={scoreData[areaPlayers[2] - 1]?.scorecard?.dual ?? 0}
                  triple={scoreData[areaPlayers[2] - 1]?.scorecard?.triple ?? 0}
                  quad={scoreData[areaPlayers[2] - 1]?.scorecard?.quad ?? 0}
                  penta={scoreData[areaPlayers[2] - 1]?.scorecard?.penta ?? 0}
                  hexa={scoreData[areaPlayers[2] - 1]?.scorecard?.hexa ?? 0}
                  chance={scoreData[areaPlayers[2] - 1]?.scorecard?.chance ?? 0}
                  poker={scoreData[areaPlayers[2] - 1]?.scorecard?.poker ?? 0}
                  fullHouse={scoreData[areaPlayers[2] - 1]?.scorecard?.full_house ?? 0}
                  smallStraight={scoreData[areaPlayers[2] - 1]?.scorecard?.small_straight ?? 0}
                  largeStraight={scoreData[areaPlayers[2] - 1]?.scorecard?.large_straight ?? 0}
                  turkey={scoreData[areaPlayers[2] - 1]?.scorecard?.turkey ?? 0}
                  diceValue={diceValue}
                  isGameOver={isGameOver}
                  winnerPlayer={winnerPlayer}
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
                  score={scoreData[areaPlayers[3] - 1]?.total_score || 0}
                  myTurn={areaPlayers[3] === currentTurnIndex + 1}
                  aiVoice={props.voice}
                  gameStartFinished={gameStartFinished}
                  ace={scoreData[areaPlayers[3] - 1]?.scorecard?.ace ?? 0}
                  dual={scoreData[areaPlayers[3] - 1]?.scorecard?.dual ?? 0}
                  triple={scoreData[areaPlayers[3] - 1]?.scorecard?.triple ?? 0}
                  quad={scoreData[areaPlayers[3] - 1]?.scorecard?.quad ?? 0}
                  penta={scoreData[areaPlayers[3] - 1]?.scorecard?.penta ?? 0}
                  hexa={scoreData[areaPlayers[3] - 1]?.scorecard?.hexa ?? 0}
                  chance={scoreData[areaPlayers[3] - 1]?.scorecard?.chance ?? 0}
                  poker={scoreData[areaPlayers[3] - 1]?.scorecard?.poker ?? 0}
                  fullHouse={scoreData[areaPlayers[3] - 1]?.scorecard?.full_house ?? 0}
                  smallStraight={scoreData[areaPlayers[3] - 1]?.scorecard?.small_straight ?? 0}
                  largeStraight={scoreData[areaPlayers[3] - 1]?.scorecard?.large_straight ?? 0}
                  turkey={scoreData[areaPlayers[3] - 1]?.scorecard?.turkey ?? 0}
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
  );
}
