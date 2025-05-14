import React from 'react'
import styles from './TurkeyDiceAcadePage.module.css'
import ArcadeMap from '../../assets/images/turkey_acade_map.png'
import ArcadeScoreCard from '../../components/turkeyDice/Arcade/TurkeyDiceScoreCard'

export default function TurkeyDiceAcadePage() {
    return (
      <div className={styles.container}>
        <div className={styles.CardContainer}>
          <div className={styles.upside}>
            <ArcadeScoreCard />
          </div>
          <div className={styles.downside}>
            <ArcadeScoreCard />
          </div>
        </div>
        <div>
          <img src={ArcadeMap} alt="Arcade Map" />
        </div>
        <div className={styles.CardContainer}>
          <div className={styles.upside}>
            <ArcadeScoreCard />
          </div>
          <div className={styles.downside}>
            <ArcadeScoreCard />
          </div>
        </div>
      </div>
    )
}
