import React from 'react'
import { Route, Routes } from 'react-router-dom'
import TurkeyDice from '../../pages/turkeyDicePage/TurkeyDice'
import TurkeyDiceDefault from '../../pages/turkeyDiceDefaultPage/TurkeyDiceDefault'
import { Socket } from 'socket.io-client';
import TurkeyDiceArcadePage from '../../pages/turkeyDiceArcadePage/TurkeyDiceArcadePage'

interface propsType {
  socket: Socket;
  gameId: number,
  people: number,
  voice: number
}

export default function TurkeyDiceRoute(props: propsType) {
  return (
    <Routes>
        <Route path='/turkey_dice' element={<TurkeyDice />} />
        <Route path='/turkey_dice/default' element={<TurkeyDiceDefault socket={props.socket} gameId={props.gameId} people={props.people} voice={props.voice}/>} />
        <Route path='/turkey_dice/arcade' element={
          <>
            <TurkeyDiceArcadePage socket={props.socket} gameId={props.gameId} people={props.people} voice={props.voice}/>
          </>
        } />
    </Routes>
  )
}