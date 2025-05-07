// apps/dashboard/src/pages/games/TurkeyDice/GameResult.tsx
import React from 'react';
import GameResult from '../../../components/games/GameResult';

const TurkeyDiceResult: React.FC = () => {
  // 플레이어 데이터 (실제로는 상태나 props로 받아올 수 있음)
  const players = [
    { id: 1, name: '가현', score: 270 },
    { id: 2, name: '경록', score: 220 },
    { id: 3, name: '웅지', score: 202 },
    { id: 4, name: '동현', score: 200 }
  ];

  return <GameResult players={players} gameId="TurkeyDice" />;
};

export default TurkeyDiceResult;
