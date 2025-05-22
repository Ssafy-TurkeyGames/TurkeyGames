import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Default from '../../pages/defaultPage/Default';

export default function DefaultRoute() {
  return (
    <Routes>
        <Route path='/' element={ <Default /> } />
    </Routes>
  )
}

