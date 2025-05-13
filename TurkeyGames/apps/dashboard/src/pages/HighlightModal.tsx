// apps/dashboard/src/pages/games/HighlightModal.tsx
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Highlight from '../components/games/Highlight';

const HighlightModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId } = useParams();
  
  // location.state에서 데이터 가져오기
  const { qrValue, title, videoId } = location.state || {};
  
  // 백엔드 설정에 맞는 QR 코드 URL 생성
  const qrCodeUrl = videoId 
    ? `http://k12e101.p.ssafy.io:9000/download/video/${videoId}`
    : `http://k12e101.p.ssafy.io:9000/download/video/${gameId}`;
  
  const handleClose = () => {
    navigate(-1); // 이전 페이지로 돌아가기
  };

  return (
    <Highlight 
      isOpen={true} 
      onClose={handleClose} 
      qrValue={qrValue || qrCodeUrl} 
      title={title || 'QR코드를 인식하면 최고의 플레이 영상을 보실 수 있어요!'} 
    />
  );
};

export default HighlightModal;
