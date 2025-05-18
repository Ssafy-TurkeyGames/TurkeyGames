import React, { use, useEffect, useRef, useState } from 'react';
import styles from './TurkeyDiceScoreCardV1.module.css';
import { calcYachtDice } from '../../../utils/checkYachtDice';
import { scoreBoardSoundFiles } from '../../../constant/soundFiles';
import buttonClickFile from '../../../assets/sound/default/button/button.mp3';
import scoreButtonClickFile from '../../../assets/sound/default/button/score_button.mp3';

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
    isGameOver: boolean,
    winnerPlayer: number,
    nextTurnButtonClick: () => void,
    throwDiceFunction: () => void,
    selectScore: (playerId: number, category: string, value: number) => Promise<void>
}

export default function TurkeyDiceScoreCardV1(props: propsType) {
    const aiVoices = ['daegil', 'flower', 'guri'];

    useEffect(() => {
        if(props.myTurn) {
            console.log(`player ${props.playerId} 차례!!!`);
        }
    }, [props.diceValue])
    
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [selectState, setSelectState] = useState<string>('');
    const [rerollButtonState, setRerollButtonState] = useState<boolean>(true);
    const [usedCategories, setUsedCategories] = useState<string[]>([]);
    const [previewScores, setPreviewScores] = useState<object>({});

    const rerollButtonClick = () => {
        if(props.isGameOver) return;
        setSelectState('');
        setPreviewScores({});
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

    // Score Area
    const selectScoreAreaClick = (category : string) => {
        if (usedCategories.includes(category)) return;

        if(audioRef.current) {
            audioRef.current.src = scoreButtonClickFile;
            audioRef.current.play();
        }

        if (selectState === category) {
            setSelectState('');
            return;
        }
        
        setSelectState(category);
    }


    // Next Turn
    const selectScoreButtonClick = async () => {
        await props.selectScore(props.playerId, selectState, calcYachtDice(props.diceValue.dice_values)[selectState]);
        
        props.nextTurnButtonClick();
        
        setUsedCategories(prev => [...prev, selectState]);
        setRerollButtonState(true);
        setSelectState('');

        if(props.isGameOver) return;
        
        if(audioRef.current) {
            audioRef.current.src = buttonClickFile;
            audioRef.current.play();
        }
    }

    useEffect(() => {
        console.log('selectState', selectState);
    }, [selectState])

    useEffect(() => {
        if (!props.gameStartFinished || !props.myTurn) return;
        if (props.isGameOver) return;

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
    }, [props.myTurn, props.gameStartFinished, props.isGameOver]);

    useEffect(() => {
        if(props.diceValue == undefined || props.diceValue.dice_values == undefined) {
            setPreviewScores({});
            return;
        }

        setPreviewScores(calcYachtDice(props.diceValue.dice_values));
        
        if(props.diceValue.rolls_left === 0) {
            setRerollButtonState(false);
            console.log("리롤 최대 횟수 달성 리롤 불가");
        }
    }, [props.diceValue]);

    useEffect(() => {
        console.log("player_id: ", props.playerId);
        console.log("previewScores: ", previewScores)
    }, [previewScores])


    return (
        <div className={styles.box}>
            {props.myTurn ? <></> : <div className={styles.block}></div>}
            {props.winnerPlayer === props.playerId ? <div className={styles.winnerblock}></div> : <></>}

            <audio ref={audioRef}/>

            <div className={styles.playerInfo} onClick={props.throwDiceFunction}>
                <div>[PLAYER {props.playerId}]</div>
                <div>SCORE {props.totalScore}</div>
            </div>

            <div className={styles.scoreLayout}>
                <div className={styles.scoreBox}>
                    <div>에이스</div>
                    <div
                        className={selectState === 'ace' || usedCategories.includes('ace') ? styles.selected : ''}
                        onClick={() => selectScoreAreaClick('ace')}
                    >
                        {
                            usedCategories.includes('ace') ? 
                            props.ace : 
                            Object.keys(previewScores).length !== 0 && props.myTurn && previewScores.ace !== 0 ? previewScores.ace : ''
                        }
                    </div>
                </div>
                <div className={styles.scoreBox}>
                    <div>듀얼</div>
                    <div 
                        className={selectState === 'dual' || usedCategories.includes('dual') ? styles.selected : ''}
                        onClick={() => selectScoreAreaClick('dual')}
                    >
                        {
                            usedCategories.includes('dual') ? 
                            props.dual : 
                            Object.keys(previewScores).length !== 0 && props.myTurn && previewScores.dual !== 0 ? previewScores.dual : ''
                        }
                    </div>
                </div>
                <div className={styles.scoreBox}>
                    <div>트리플</div>
                    <div 
                        className={selectState === 'triple' || usedCategories.includes('triple') ? styles.selected : ''}
                        onClick={() => selectScoreAreaClick('triple')}
                    >
                        {
                            usedCategories.includes('triple') ? 
                            props.triple : 
                            Object.keys(previewScores).length !== 0 && props.myTurn && previewScores.triple !== 0 ? previewScores.triple : ''
                        }
                    </div>
                </div>
                <div className={styles.scoreBox}>
                    <div>쿼드</div>
                    <div 
                        className={selectState === 'quad' || usedCategories.includes('quad') ? styles.selected : ''}
                        onClick={() => selectScoreAreaClick('quad')}
                    >
                        {
                            usedCategories.includes('quad') ? 
                            props.quad : 
                            Object.keys(previewScores).length !== 0 && props.myTurn && previewScores.quad !== 0 ? previewScores.quad : ''
                        }
                    </div>
                </div>
                <div className={styles.scoreBox}>
                    <div>펜타</div>
                    <div 
                        className={selectState === 'penta' || usedCategories.includes('penta') ? styles.selected : ''}
                        onClick={() => selectScoreAreaClick('penta')}
                    >
                        {
                            usedCategories.includes('penta') ? 
                            props.penta : 
                            Object.keys(previewScores).length !== 0 && props.myTurn && previewScores.penta !== 0 ? previewScores.penta : ''
                        }
                    </div>
                </div>
                <div className={styles.hexa}>
                    <div>헥사</div>
                    <div 
                        className={selectState === 'hexa' || usedCategories.includes('hexa') ? styles.selected : ''}
                        onClick={() => selectScoreAreaClick('hexa')}
                    >
                        {
                            usedCategories.includes('hexa') ? 
                            props.hexa : 
                            Object.keys(previewScores).length !== 0 && props.myTurn && previewScores.hexa !== 0 ? previewScores.hexa : ''
                        }
                    </div>
                </div>
                <div className={styles.scoreBox}>
                    <div>찬스</div>
                    <div
                        className={selectState === 'chance' || usedCategories.includes('chance') ? styles.selected : ''}
                        onClick={() => selectScoreAreaClick('chance')}
                    >
                        {
                            usedCategories.includes('chance') ? 
                            props.chance : 
                            Object.keys(previewScores).length !== 0 && props.myTurn && previewScores.chance !== 0 ? previewScores.chance : ''
                        }
                    </div>
                </div>
                <div className={styles.scoreBox}>
                    <div>포커</div>
                    <div
                        className={selectState === 'poker' || usedCategories.includes('poker') ? styles.selected : ''}
                        onClick={() => selectScoreAreaClick('poker')}
                    >
                        {
                            usedCategories.includes('poker') ? 
                            props.poker : 
                            Object.keys(previewScores).length !== 0 && props.myTurn && previewScores.poker !== 0 ? previewScores.poker : ''
                        }
                    </div>
                </div>
                <div className={styles.scoreBox}>
                    <div>풀하우스</div>
                    <div 
                        className={selectState === 'full_house' || usedCategories.includes('full_house') ? styles.selected : ''}
                        onClick={() => selectScoreAreaClick('full_house')}
                    >
                        {
                            usedCategories.includes('full_house') ? 
                            props.fullHouse : 
                            Object.keys(previewScores).length !== 0 && props.myTurn && previewScores.full_house !== 0 ? previewScores.full_house : ''
                        }
                    </div>
                </div>
                <div className={styles.scoreBox}>
                    <div>SS</div>
                    <div
                        className={selectState === 'small_straight' || usedCategories.includes('small_straight') ? styles.selected : ''}
                        onClick={() => selectScoreAreaClick('small_straight')}
                    >
                        {
                            usedCategories.includes('small_straight') ? 
                            props.smallStraight : 
                            Object.keys(previewScores).length !== 0 && props.myTurn && previewScores.small_straight !== 0 ? previewScores.small_straight : ''
                        }
                    </div>
                </div>
                <div className={styles.scoreBox}>
                    <div>LS</div>
                    <div
                        className={selectState === 'large_straight' || usedCategories.includes('large_straight') ? styles.selected : ''}
                        onClick={() => selectScoreAreaClick('large_straight')}
                    >
                        {
                            usedCategories.includes('large_straight') ? 
                            props.largeStraight : 
                            Object.keys(previewScores).length !== 0 != 0 && props.myTurn && previewScores.large_straight !== 0 ? previewScores.large_straight : ''
                        }
                    </div>
                </div>
                <div className={styles.turkey}>
                    <div>터키</div>
                    <div 
                        className={selectState === 'turkey' || usedCategories.includes('turkey') ? styles.selected : ''}
                        onClick={() => selectScoreAreaClick('turkey')}
                    >
                        {
                            usedCategories.includes('turkey') ? 
                            props.turkey : 
                            Object.keys(previewScores).length !== 0 && props.myTurn && previewScores.turkey !== 0 ? previewScores.turkey : ''
                        }
                    </div>
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
                <div
                    className={selectState === '' ? styles.disabled : styles.abled}
                    onClick={selectScoreButtonClick}
                >
                    NEXT TURN
                </div>
            </div>

        </div>
    )
}