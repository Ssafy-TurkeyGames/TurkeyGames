import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './index.css';

// 이 한 줄 추가 (Vite에서는 이렇게 환경 구분)
const isProd = import.meta.env.MODE === 'production';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={isProd ? '/dashboard' : undefined}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
