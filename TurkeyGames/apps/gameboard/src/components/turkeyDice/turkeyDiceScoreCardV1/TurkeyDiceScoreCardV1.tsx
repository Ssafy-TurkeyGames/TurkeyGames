import React, { useEffect, useRef } from 'react';
import styles from './TurkeyDiceScoreCardV1.module.css';

import daegilRerollFile1 from '../../../assets/sound/daegil/reroll/reroll_v1.mp3';
import daegilRerollFile2 from '../../../assets/sound/daegil/reroll/reroll_v2.mp3';
import daegilRerollFile3 from '../../../assets/sound/daegil/reroll/reroll_v3.mp3';
import flowerRerollFile1 from '../../../assets/sound/flower/reroll/reroll_v1.mp3';
import flowerRerollFile2 from '../../../assets/sound/flower/reroll/reroll_v2.mp3';
import flowerRerollFile3 from '../../../assets/sound/flower/reroll/reroll_v3.mp3';
import guriRerollFile1 from '../../../assets/sound/guri/reroll/reroll_v3.mp3';
import guriRerollFile2 from '../../../assets/sound/guri/reroll/reroll_v3.mp3';
import guriRerollFile3 from '../../../assets/sound/guri/reroll/reroll_v3.mp3';

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
    nextTurnButtonClick: () => void
}

export default function TurkeyDiceScoreCardV1(props: propsType) {
    
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const rerollSoundFiles = props.aiVoice === 1 ? [daegilRerollFile1, daegilRerollFile2, daegilRerollFile3]
                       : props.aiVoice === 2 ? [flowerRerollFile1, flowerRerollFile2, flowerRerollFile3]
                       : [guriRerollFile1, guriRerollFile2, guriRerollFile3];
    
    const rerollButtonClick = () => {
        const randomSound = rerollSoundFiles[Math.floor(Math.random() * rerollSoundFiles.length)];
        if (audioRef.current) {
            audioRef.current.src = randomSound;
            audioRef.current.play();
        }
    }

    useEffect(() => {
        if (!props.gameStartFinished || !props.myTurn) return;
        let randomSoundFiles: any[] = [];
        if(props.myTurn) {
            if(props.aiVoice === 1) {
                if(props.playerId === 1) {
                    randomSoundFiles = [daegilMyturnPlayer1V1, daegilMyturnPlayer1V2, daegilMyturnPlayer1V3];
                }else if(props.playerId === 2) {
                    randomSoundFiles = [daegilMyturnPlayer2V1, daegilMyturnPlayer2V2, daegilMyturnPlayer2V3];
                }else if(props.playerId === 3) {
                    randomSoundFiles = [daegilMyturnPlayer3V1, daegilMyturnPlayer3V2, daegilMyturnPlayer3V3];
                }else if(props.playerId === 4) {
                    randomSoundFiles = [daegilMyturnPlayer4V1, daegilMyturnPlayer4V2, daegilMyturnPlayer4V3];
                }
            }else if(props.aiVoice === 2) {
                if(props.playerId === 1) {
                    randomSoundFiles = [flowerMyturnPlayer1V1, flowerMyturnPlayer1V2, flowerMyturnPlayer1V3];
                }else if(props.playerId === 2) {
                    randomSoundFiles = [flowerMyturnPlayer2V1, flowerMyturnPlayer2V2, flowerMyturnPlayer2V3];
                }else if(props.playerId === 3) {
                    randomSoundFiles = [flowerMyturnPlayer3V1, flowerMyturnPlayer3V2, flowerMyturnPlayer3V3];
                }else if(props.playerId === 4) {
                    randomSoundFiles = [flowerMyturnPlayer4V1, flowerMyturnPlayer4V2, flowerMyturnPlayer4V3];
                }
            }else if(props.aiVoice === 3) {
                if(props.playerId === 1) {
                    randomSoundFiles = [guriMyturnPlayer1V1, guriMyturnPlayer1V2, guriMyturnPlayer1V3];
                }else if(props.playerId === 2) {
                    randomSoundFiles = [guriMyturnPlayer2V1, guriMyturnPlayer2V2, guriMyturnPlayer2V3];
                }else if(props.playerId === 3) {
                    randomSoundFiles = [guriMyturnPlayer3V1, guriMyturnPlayer3V2, guriMyturnPlayer3V3];
                }else if(props.playerId === 4) {
                    randomSoundFiles = [guriMyturnPlayer4V1, guriMyturnPlayer4V2, guriMyturnPlayer4V3];
                }
            }
        }
        const randomSound = randomSoundFiles[Math.floor(Math.random() * 3)]; 
        if (audioRef.current) {
            audioRef.current.src = randomSound;
            audioRef.current.play();
        }
    }, [props.myTurn, props.gameStartFinished]);

  return (
    <div className={styles.box}>
        {props.myTurn ? <></> : <div className={styles.block}></div>}
        <audio ref={audioRef}/>

        <div className={styles.playerInfo}>
            <div>[PLAYER {props.playerId}]</div>
            <div>SCORE</div>
        </div>

        <div className={styles.scoreLayout}>
            <div className={styles.scoreBox}>
                <div>에이스</div>
                <div>{props.ace}</div>
            </div>
            <div className={styles.scoreBox}>
                <div>듀얼</div>
                <div>{props.dual}</div>
            </div>
            <div className={styles.scoreBox}>
                <div>트리플</div>
                <div>{props.triple}</div>
            </div>
            <div className={styles.scoreBox}>
                <div>쿼드</div>
                <div>{props.quad}</div>
            </div>
            <div className={styles.scoreBox}>
                <div>펜타</div>
                <div>{props.penta}</div>
            </div>
            <div className={styles.hexa}>
                <div>헥사</div>
                <div>{props.hexa}</div>
            </div>
            <div className={styles.scoreBox}>
                <div>찬스</div>
                <div>{props.chance}</div>
            </div>
            <div className={styles.scoreBox}>
                <div>포커</div>
                <div>{props.poker}</div>
            </div>
            <div className={styles.scoreBox}>
                <div>풀하우스</div>
                <div>{props.fullHouse}</div>
            </div>
            <div className={styles.scoreBox}>
                <div>SS</div>
                <div>{props.smallStraight}</div>
            </div>
            <div className={styles.scoreBox}>
                <div>LS</div>
                <div>{props.largeStraight}</div>
            </div>
            <div className={styles.turkey}>
                <div>터키</div>
                <div>{props.turkey}</div>
            </div>
        </div>

        <div className={styles.buttons}>
            <div onClick={rerollButtonClick}>REROLL</div>
            <div onClick={props.nextTurnButtonClick}>NEXT TURN</div>
        </div>

    </div>
  )
}