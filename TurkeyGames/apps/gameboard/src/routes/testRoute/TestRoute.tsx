import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Test from '../../pages/testPage/Test'
import TurkeyDiceAcadePage from '../../pages/turkeyDiceAcadePage/TurkeyDiceAcadePage'

export default function TestRoute() {
  return (
    <Routes>
        <Route path='/test' element={<TurkeyDiceAcadePage />} />
    </Routes>
  )
}