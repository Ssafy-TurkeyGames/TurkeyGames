import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Default from '../../pages/defaultPage/Default';
import { GameWebSocketProvider } from '../../components/websocket/WebSocketProvider';

export default function DefaultRoute() {
  return (
    <GameWebSocketProvider>
      <Routes>
          <Route path='/' element={ <Default /> } />
      </Routes>
    </GameWebSocketProvider>
  )
}

