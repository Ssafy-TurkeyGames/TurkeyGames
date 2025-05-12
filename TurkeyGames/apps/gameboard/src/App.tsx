import React from 'react';
import { Route, Routes } from 'react-router-dom';
import DefaultRoute from './routes/defaultRoute/DefaultRoute';
import TurkeyDiceRoute from './routes/turkeyDiceRoute/TurkeyDiceRoute';
import TestRoute from './routes/testRoute/TestRoute';
import FiveSec from './pages/FiveSecPage/FiveSec';

function App() {
  return (
    <Routes>
      <Route path='/gameboard/*' element={
        <>
          <DefaultRoute />
          <TurkeyDiceRoute />
          <TestRoute />
          <FiveSec />
        </>
      }
      />
    </Routes>
  );
}

export default App;
