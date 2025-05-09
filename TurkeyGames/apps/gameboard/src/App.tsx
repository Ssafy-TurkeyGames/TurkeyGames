import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { GameWebSocketProvider } from './components/websocket/WebSocketProvider';
import DefaultRoute from './routes/defaultRoute/DefaultRoute';
import TurkeyDiceRoute from './routes/turkeyDiceRoute/TurkeyDiceRoute';

function App() {
  return (
    <GameWebSocketProvider>
      <Routes>
        <Route path='/gameboard/*' element={
          <>
            <DefaultRoute />
            <TurkeyDiceRoute />
          </>
        }
        />
      </Routes>
    </GameWebSocketProvider>
  );
}

export default App;
