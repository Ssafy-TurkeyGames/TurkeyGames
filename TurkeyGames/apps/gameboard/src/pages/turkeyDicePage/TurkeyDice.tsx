import React from 'react';
import styles from './TurkeyDice.module.css';
import turkey from '../../assets/images/turkey.png'
import acadeTurkey from '../../assets/images/turkey_acade.png'
import SpinTurkey from '../../components/common/spinTurkey/SpinTurkey';
import turkeyDiceDefaultMap from '../../assets/images/turkey_default_map.png';
import turkeyDuceDefaultScore from '../../assets/images/turkey_default_score.png';
import turkeyDiceAcadeMap from '../../assets/images/turkey_acade_map.png';
import turkeyDiceAcadeScore from '../../assets/images/turkey_acade_score.png';
import TurkeyDiceScoreCard from '../../components/turkeyDice/TurkeyDiceScoreCard/TurkeyDiceScoreCard';
import { SpriteAnimator } from 'react-sprite-animator';
import test from '../../assets/effect/test.jpg';



export default function TurkeyDice({}) {
  return (
    <div className={styles.layout}>
      <div className={styles.spinBox}>
        <SpinTurkey image={turkey} />
      </div>
      <div className={styles.leftArea}>
        <TurkeyDiceScoreCard image={turkeyDuceDefaultScore} />
        <TurkeyDiceScoreCard image={turkeyDuceDefaultScore} />
      </div>
      
      <div className={styles.map}>
        <img src={turkeyDiceDefaultMap} alt="turkeyDice Map" />
      </div>
      <div className={styles.rightArea}>
        <TurkeyDiceScoreCard image={turkeyDuceDefaultScore} />
        <TurkeyDiceScoreCard image={turkeyDuceDefaultScore} />
      </div>
    </div>
  )
}