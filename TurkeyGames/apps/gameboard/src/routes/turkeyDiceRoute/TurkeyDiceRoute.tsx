import React from 'react'
import { Route, Routes } from 'react-router-dom'
import TurkeyDice from '../../pages/turkeyDicePage/TurkeyDice'
import TurkeyDiceDefault from '../../pages/turkeyDiceDefaultPage/TurkeyDiceDefault'
import TurkeyDiceArcadePage from '../../pages/turkeyDiceArcadePage/TurkeyDiceArcadePage'

interface propsType {
  gameId: number,
  people: number,
  voice: number
}

export default function TurkeyDiceRoute(props: propsType) {
  console.log("TurkeyDiceRoute rendered with props:", props);
  return (
    <Routes>
        <Route path='/turkey_dice' element={<TurkeyDice />} />
        <Route path='/turkey_dice/default' element={<TurkeyDiceDefault gameId={props.gameId} people={props.people} voice={props.voice}/>} />
        <Route path='/turkey_dice/arcade' element={
          <>
            {console.log("Rendering TurkeyDiceArcadePage with props:", props)}
            <TurkeyDiceArcadePage gameId={props.gameId} people={props.people} voice={props.voice}/>
          </>
        } />
    </Routes>
  )
}