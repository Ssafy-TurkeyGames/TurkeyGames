import React from 'react';
import { Route, Routes } from 'react-router-dom';
import DefaultRoute from './routes/defaultRoute/DefaultRoute';
import TurkeyDiceRoute from './routes/turkeyDiceRoute/TurkeyDiceRoute';

function App() {
  return (
    <Routes>
      <Route path='/gameboard/*' element={
        <>
          <DefaultRoute />
          <TurkeyDiceRoute />
        </>
      }
      />
    </Routes>
  );
}

export default App;
