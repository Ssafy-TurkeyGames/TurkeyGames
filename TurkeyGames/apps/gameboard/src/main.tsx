import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
  path: "/socket.io",
  transports: ["websocket"]
});

// 연결 성공 시
socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App socket={socket} />
    </BrowserRouter>
  </React.StrictMode>
);