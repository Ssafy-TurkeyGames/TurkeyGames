import React from 'react'
import { Route, Routes } from 'react-router-dom'
import FiveSec from '../../pages/FiveSecPage/FiveSec'

export default function TurkeyDiceRoute() {
  return (
    <Routes>
        <Route path='/five_sec' element={<FiveSec />} />
    </Routes>
  )
}