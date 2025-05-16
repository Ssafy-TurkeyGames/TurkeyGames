import React, { use, useEffect, useRef, useState } from 'react';
import styles from './TurkeyDiceScoreCardV1.module.css';
import { calcYachtDice } from '../../../utils/checkYachtDice';
import { scoreBoardSoundFiles } from '../../../constant/soundFiles';

interface propsType {
    playerId: number,
    myTurn: boolean,
    aiVoice: number,
    gameStartFinished: boolean,
    ace: number,
    dual: number,
    triple: number,
    quad: number,
    penta: number,
    hexa: number,
    chance: number,
    poker: number,
    fullHouse: number,
    smallStraight: number,
    largeStraight: number,
    turkey: number,
    totalScore: number,
    diceValue: object | undefined,
    nextTurnButtonClick: () => void,
    throwDiceFunction: () => void,
    selectScore: (playerId: number, category: string, value: number) => Promise<void>
}

export default function TurkeyDiceScoreCardV1(props: propsType) {
    const aiVoices = ['daegil', 'flower', 'guri'];
    
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [selectState, setSelectState] = useState<string>('');
    const [rerollButtonState, setRerollButtonState] = useState<boolean>(true);

    const rerollButtonClick = () => {
        const ai = aiVoices[props.aiVoice - 1];
        const rerollFiles = 
            ai === 'daegil' ? scoreBoardSoundFiles.daegil.reroll :
            ai === 'flower' ? scoreBoardSoundFiles.flower.reroll : 
            scoreBoardSoundFiles.guri.reroll;  
        const randomSound = rerollFiles[Math.floor(Math.random() * rerollFiles.length)];
        if(audioRef.current) {
            audioRef.current.src = randomSound;

            // 주사위 리롤 안내 음성 끝난후 주사위 새로 굴리기기
            audioRef.current.onended = () => {
                props.throwDiceFunction();
            };

            audioRef.current.play();
        }
        
    }

    const selectScoreButtonClick = () => {
        console.log(props.diceValue);
        props.selectScore(props.playerId, selectState, calcYachtDice(props.diceValue.dice_values)[selectState]);
        setRerollButtonState(true);
        props.nextTurnButtonClick();
    }

    useEffect(() => {
        console.log('selectState', selectState);
    }, [selectState])

    useEffect(() => {
        if (!props.gameStartFinished || !props.myTurn) return;

        const ai = aiVoices[props.aiVoice - 1];
        const myturnFiles = 
            ai === 'daegil' ? scoreBoardSoundFiles.daegil.myturn :
            ai === 'flower' ? scoreBoardSoundFiles.flower.myturn : 
            scoreBoardSoundFiles.guri.myturn;

        let randomSound: any[] = [];
        
        switch(props.playerId) {
            case 1:
                randomSound = myturnFiles[1];
                break;
            case 2:
                randomSound = myturnFiles[2];
                break;
            case 3:
                randomSound = myturnFiles[3];
                break;
            case 4:
                randomSound = myturnFiles[4];
                break;
        }

        if(audioRef.current) {
            audioRef.current.src = randomSound[Math.floor(Math.random() * randomSound.length)];
            audioRef.current.play();
        }
    }, [props.myTurn, props.gameStartFinished]);

    useEffect(() => {
        if(props.diceValue == undefined) return;
        
        if(props.diceValue.rolls_left === 0) {
            setRerollButtonState(false);
            console.log("리롤 최대 횟수 달성 리롤 불가");
        }
    }, [props.diceValue]);


    return (
        <div className={styles.box}>
            {props.myTurn ? <></> : <div className={styles.block}></div>}
            <audio ref={audioRef}/>

            <div className={styles.playerInfo} onClick={props.throwDiceFunction}>
                <div>[PLAYER {props.playerId}]</div>
                <div>SCORE {props.totalScore}</div>
            </div>

            <div className={styles.scoreLayout}>
                <div className={styles.scoreBox}>
                    <div>에이스</div>
                    <div onClick={() => setSelectState('ace')}>{props.ace}</div>
                </div>
                <div className={styles.scoreBox}>
                    <div>듀얼</div>
                    <div onClick={() => setSelectState('dual')}>{props.dual}</div>
                </div>
                <div className={styles.scoreBox}>
                    <div>트리플</div>
                    <div onClick={() => setSelectState('triple')}>{props.triple}</div>
                </div>
                <div className={styles.scoreBox}>
                    <div>쿼드</div>
                    <div onClick={() => setSelectState('quad')}>{props.quad}</div>
                </div>
                <div className={styles.scoreBox}>
                    <div>펜타</div>
                    <div onClick={() => setSelectState('penta')}>{props.penta}</div>
                </div>
                <div className={styles.hexa}>
                    <div>헥사</div>
                    <div onClick={() => setSelectState('hexa')}>{props.hexa}</div>
                </div>
                <div className={styles.scoreBox}>
                    <div>찬스</div>
                    <div onClick={() => setSelectState('chance')}>{props.chance}</div>
                </div>
                <div className={styles.scoreBox}>
                    <div>포커</div>
                    <div onClick={() => setSelectState('poker')}>{props.poker}</div>
                </div>
                <div className={styles.scoreBox}>
                    <div>풀하우스</div>
                    <div onClick={() => setSelectState('full_house')}>{props.fullHouse}</div>
                </div>
                <div className={styles.scoreBox}>
                    <div>SS</div>
                    <div onClick={() => setSelectState('small_straight')}>{props.smallStraight}</div>
                </div>
                <div className={styles.scoreBox}>
                    <div>LS</div>
                    <div onClick={() => setSelectState('large_straight')}>{props.largeStraight}</div>
                </div>
                <div className={styles.turkey}>
                    <div>터키</div>
                    <div onClick={() => setSelectState('turkey')}>{props.turkey}</div>
                </div>
            </div>

            <div className={styles.buttons}>
                <div 
                    onClick={rerollButtonState ? rerollButtonClick : undefined}
                    className={!rerollButtonState ? styles.disabled : styles.abled}
                >
                        REROLL
                </div>
                {/* <div onClick={props.nextTurnButtonClick}>NEXT TURN</div> */}
                <div onClick={selectScoreButtonClick}>NEXT TURN</div>
            </div>

        </div>
    )
}