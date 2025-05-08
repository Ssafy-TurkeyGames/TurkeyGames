import React from 'react'
import styles from './TurkeyDiceScoreCard.module.css';

interface propsType {
  image: string
}

export default function TurkeyDiceScoreCard(props: propsType) {
  return (
    <div className={styles.layout}>
      <img src={props.image} alt="score card" />
    </div>
  )
}
