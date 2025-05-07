// apps/dashboard/src/pages/games/HighlightModal.tsx
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Highlight from '../components/games/Highlight';

const HighlightModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId } = useParams();
  
  // location.state에서 데이터 가져오기
  const { qrValue, title } = location.state || {};
  
  const handleClose = () => {
    navigate(-1); // 이전 페이지로 돌아가기
  };

  return (
    <Highlight 
      isOpen={true} 
      onClose={handleClose} 
      qrValue={qrValue || `https://example.com/games/${gameId}/highlights`} 
      title={title || 'QR코드를 인식하면 최고의 플레이 영상을 보실 수 있어요!'} 
    />
  );
};

export default HighlightModal;
