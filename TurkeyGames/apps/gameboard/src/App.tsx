import React, { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import DefaultRoute from './routes/defaultRoute/DefaultRoute';
import TurkeyDiceRoute from './routes/turkeyDiceRoute/TurkeyDiceRoute';
import TestRoute from './routes/testRoute/TestRoute';
import { Socket } from 'socket.io-client';

type props = {
  socket: Socket;
};

function App({ socket } : props) {
  const navigate = useNavigate();
  const [gameCreatedData, setGameCreatedData] = useState(null);

  useEffect(() => {
    socket.on('game_created', (data) => {
      console.log('게임이 생성되었습니다.', data);
      setGameCreatedData(data);
      if(data.settings.map === 1) {
        navigate('/gameboard/turkey_dice/default');
      }else if(data.settings.map === 2) {
        navigate('/gameboard/turkey_dice/acade')
      }
    });
  }, [socket]);

  return (
    <Routes>
      <Route path='/gameboard/*' element={
        <>
          <DefaultRoute />
          {gameCreatedData && (
          <TurkeyDiceRoute
            gameId={gameCreatedData.game_Id}
            people={gameCreatedData.settings.people}
            voice={gameCreatedData.settings.voice}
          />
        )}
          <TestRoute />
        </>
      }
      />
    </Routes>
  );
}

export default App;
