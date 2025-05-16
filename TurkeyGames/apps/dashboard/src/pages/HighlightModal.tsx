// apps/dashboard/src/pages/HighlightModal.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Highlight from '../components/games/Highlight';
import { getHighlightData, HighlightData } from '../api/dashboardApi';

const HighlightModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId, playerId } = useParams();
  const [highlightData, setHighlightData] = useState<HighlightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // location.state에서 데이터 가져오기
  const { qrValue: stateQrValue, title: stateTitle, videoId } = location.state || {};
  
  // 모달 모드인지 확인 (backgroundLocation이 있으면 모달 모드)
  const isModalMode = Boolean(location.state?.backgroundLocation);
  console.log('[HighlightModal] 모달 모드:', isModalMode);
  
  useEffect(() => {
    const fetchHighlightData = async () => {
      try {
        if (!gameId || !playerId) {
          // 이전 방식으로 fallback (gameId만 있는 경우)
          setLoading(false);
          return;
        }
        
        const response = await getHighlightData(gameId, playerId);
        setHighlightData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('하이라이트 데이터를 가져오는 중 오류 발생:', err);
        setError('하이라이트 영상을 찾을 수 없습니다.');
        setLoading(false);
      }
    };
    
    // playerId가 있을 때만 API 호출
    if (playerId) {
      fetchHighlightData();
    } else {
      setLoading(false);
    }
  }, [gameId, playerId]);
  
  const handleClose = () => {
    if (isModalMode) {
      navigate(-1); // 모달 모드에서는 이전 페이지로 돌아가기
    } else {
      navigate('/'); // 일반 페이지 모드에서는 홈으로 이동
    }
  };

  // 백엔드 설정에 맞는 QR 코드 URL 생성 (이전 방식 - API 호출 실패 시 fallback)
  const qrCodeUrl = videoId 
    ? `http://k12e101.p.ssafy.io:9000/download/video/${videoId}`
    : `http://k12e101.p.ssafy.io:9000/download/video/${gameId}`;

  return (
    <Highlight 
      isOpen={true} 
      onClose={handleClose} 
      qrValue={highlightData?.qr_code || stateQrValue || qrCodeUrl} 
      title={stateTitle || '최고의 플레이 영상을 확인하세요!'} 
      loading={loading}
      error={error}
      localPath={highlightData?.local_path}
      minioPath={highlightData?.minio_path}
      localQrPath={highlightData?.local_qr_path}
    />
  );
};

export default HighlightModal;
