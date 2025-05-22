// apps/dashboard/src/pages/HighlightModal.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Highlight from '../components/games/Highlight';
import { getHighlightData } from '../api/dashboardApi';
import { HighlightData } from '../api/types'; // 타입 임포트 수정

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
  console.log('[HighlightModal] 파라미터 - gameId:', gameId, 'playerId:', playerId);
  console.log('[HighlightModal] location.state:', location.state);
  console.log('[HighlightModal] 현재 경로:', location.pathname);
  
  useEffect(() => {
    const fetchHighlightData = async () => {
      try {
        if (!gameId || !playerId) {
          console.log('[HighlightModal] gameId 또는 playerId가 없음, API 호출 건너뜀');
          // API 호출 없이 진행
          setLoading(false);
          return;
        }
        
        console.log(`[HighlightModal] 하이라이트 데이터 요청 시작 - gameId: ${gameId}, playerId: ${playerId}`);
        try {
          const response = await getHighlightData(gameId, playerId);
          console.log('[HighlightModal] API 응답:', response);
          
          // response 자체가 데이터 객체인 경우 처리
          if (response && (response.minio_qr_path || response.qr_code)) {
            console.log('[HighlightModal] 하이라이트 데이터 수신 성공:', response);
            setHighlightData(response); // response 자체가 데이터 객체
            setError(null);
          } else if (response && response.data) {
            // 혹시 response.data 형태로 오는 경우 대비
            console.log('[HighlightModal] 하이라이트 데이터 수신 성공 (data):', response.data);
            setHighlightData(response.data);
            setError(null);
          } else {
            console.error('[HighlightModal] API 응답 오류:', response);
            setError('하이라이트 데이터 형식이 올바르지 않습니다.');
          }
        } catch (apiError) {
          console.error('[HighlightModal] API 호출 실패, 기본 QR 코드 사용:', apiError);
        }
        setLoading(false);
      } catch (err) {
        console.error('[HighlightModal] 하이라이트 데이터를 가져오는 중 오류 발생:', err);
        setError('하이라이트 영상을 찾을 수 없습니다.');
        setLoading(false);
      }
    };
    
    // API 호출 시도
    fetchHighlightData();
  }, [gameId, playerId]);
  
  const handleClose = () => {
    console.log('[HighlightModal] 모달 닫기');
    if (isModalMode) {
      navigate(-1); // 모달 모드에서는 이전 페이지로 돌아가기
    } else {
      navigate('/'); // 일반 페이지 모드에서는 홈으로 이동
    }
  };

  // 사용할 QR 코드 URL 결정 (우선순위: API 응답 > state > 기본 URL)
  const qrCodeUrl = highlightData?.qr_code || stateQrValue || 
    (videoId ? `http://k12e101.p.ssafy.io:9000/download/video/${videoId}` : 
    gameId ? `http://k12e101.p.ssafy.io:9000/download/video/${gameId}` : '');
  
  console.log('[HighlightModal] 사용할 QR 코드 URL:', qrCodeUrl);
  console.log('[HighlightModal] 사용할 MinIO QR Path:', highlightData?.minio_qr_path);

  return (
    <Highlight 
      isOpen={true} 
      onClose={handleClose} 
      qrValue={qrCodeUrl} 
      title={stateTitle || '최고의 플레이 영상을 확인하세요!'} 
      loading={loading}
      error={error}
      localPath={highlightData?.local_path}
      minioPath={highlightData?.minio_path}
      localQrPath={highlightData?.local_qr_path}
      minioQrPath={highlightData?.minio_qr_path}
    />
  );
};

export default HighlightModal;