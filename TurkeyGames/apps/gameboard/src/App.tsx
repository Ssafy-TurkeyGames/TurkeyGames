import React from 'react';
import { Route, Routes } from 'react-router-dom';
import DefaultRoute from './routes/defaultRoute/DefaultRoute';

function App() {
  return (
    <Routes>
      <Route path='/gameboard' element={
        <>
          <DefaultRoute /> 
        </>
      }
      />
    </Routes>
  );
}

export default App;
