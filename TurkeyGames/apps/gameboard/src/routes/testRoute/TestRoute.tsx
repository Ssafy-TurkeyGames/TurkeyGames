import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Test from '../../pages/testPage/Test'


export default function TestRoute() {
  return (
    <Routes>
        <Route path='/test' element={<Test />} />
    </Routes>
  )
}