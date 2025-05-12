import React from 'react'
import { Route, Routes } from 'react-router-dom'
import TurkeyDice from '../../pages/turkeyDicePage/TurkeyDice'
import TurkeyDiceDefault from '../../pages/turkeyDiceDefaultPage/TurkeyDiceDefault'

interface propsType {
  gameId: number,
  people: number,
  voice: number
}

export default function TurkeyDiceRoute(props: propsType) {
  return (
    <Routes>
        <Route path='/turkey_dice' element={<TurkeyDice />} />
        <Route path='/turkey_dice/default' element={<TurkeyDiceDefault gameId={props.gameId} people={props.people} voice={props.voice}/>} />
    </Routes>
  )
}