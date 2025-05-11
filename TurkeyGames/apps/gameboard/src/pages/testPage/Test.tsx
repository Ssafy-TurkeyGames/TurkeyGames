import React, { useState } from 'react';
import styles from './Test.module.css';
import TurkeyDiceScoreCardV1 from '../../components/turkeyDice/turkeyDiceScoreCardV1/TurkeyDiceScoreCardV1';


export default function Test() {

  const [state, setState] = useState<boolean>(false);
  // const [number, setNumber] = useState<number>(0);

  const nextTurnButtonClick = () => {
    setState(false);
  }

  return (
    <div className={styles.layout}>
      <TurkeyDiceScoreCardV1
        playerId={1}
        myTurn={state}
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
      <button onClick={() => setState(!state)}>버튼</button>
      {/* <button onClick={() => setNumber(number + 1)}>버튼</button> */}
    </div>
  )
}
