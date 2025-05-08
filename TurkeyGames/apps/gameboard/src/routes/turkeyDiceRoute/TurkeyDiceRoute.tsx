import React from 'react'
import { Route, Routes } from 'react-router-dom'
import TurkeyDice from '../../pages/turkeyDicePage/TurkeyDice'

export default function TurkeyDiceRoute() {
  return (
    <Routes>
        <Route path='/turkey_dice' element={<TurkeyDice />} />
    </Routes>
  )
}