import React, { useRef } from 'react';
import styles from './TurkeyDiceScoreCardV1.module.css';
import daegilRerollFile1 from '../../../assets/sound/daegil/reroll/reroll_v1.mp3';
import daegilRerollFile2 from '../../../assets/sound/daegil/reroll/reroll_v2.mp3';
import daegilRerollFile3 from '../../../assets/sound/daegil/reroll/reroll_v3.mp3';
import flowerRerollFile1 from '../../../assets/sound/flower/reroll/reroll_v1.mp3';
import flowerRerollFile2 from '../../../assets/sound/flower/reroll/reroll_v2.mp3';
import flowerRerollFile3 from '../../../assets/sound/flower/reroll/reroll_v3.mp3';

interface propsType {
    playerId: number,
    myTurn: boolean,
    aiVoice: number,
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
    const soundFiles = props.aiVoice === 1 ? [daegilRerollFile1, daegilRerollFile2, daegilRerollFile3]
                       : [flowerRerollFile1, flowerRerollFile2, flowerRerollFile3];
    
    const rerollButtonClick = () => {
        const randomSound = soundFiles[Math.floor(Math.random() * soundFiles.length)];
        if (audioRef.current) {
            audioRef.current.src = randomSound;
            audioRef.current.play();
        }
    }

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