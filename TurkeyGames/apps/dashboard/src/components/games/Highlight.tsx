// apps/dashboard/src/components/games/Highlight.tsx
import React, { useCallback } from 'react';
import styles from './Highlight.module.css';
import closeIcon from '../../assets/images/close (1).png';
import loadingIcon from '../../assets/images/loading.png';

interface HighlightProps {
  isOpen: boolean;
  onClose: () => void;
  qrValue?: string;
  title?: string;
  loading?: boolean;
  error?: string | null;
  localPath?: string;
  minioPath?: string;
  localQrPath?: string;
  minioQrPath?: string; // 추가: 명세서에 있는 minio_qr_path 필드
}

const Highlight: React.FC<HighlightProps> = ({ 
  isOpen, 
  onClose, 
  qrValue, 
  title = '최고의 플레이 영상을 확인하세요!',
  loading = false,
  error = null,
  localPath,
  minioPath,
  localQrPath,
  minioQrPath
}) => {
  console.log('[Highlight] 렌더링 시작');
  console.log('[Highlight] Props:', { 
    isOpen, qrValue, title, loading, error, 
    localPath, minioPath, localQrPath, minioQrPath 
  });
  
  if (!isOpen) return null;

  // local_qr_path 처리 - C:/ 확인 및 추가
  const formattedQrPath = localQrPath 
    ? (!localQrPath.startsWith('C:/') && !localQrPath.startsWith('C:\\')) 
      ? `C:/${localQrPath.replace(/^\/+/, '')}` // 앞에 있는 슬래시 제거 후 C:/ 추가
      : localQrPath
    : null;
  
  console.log('[Highlight] 포맷된 QR 경로:', formattedQrPath);

  const handleDownload = () => {
    console.log('[Highlight] 다운로드 버튼 클릭, URL:', qrValue);
    if (qrValue) {
      window.open(qrValue, '_blank');
    }
  };

  // 모달 오버레이 클릭 핸들러 - 모달 바깥 영역 클릭 시 닫기
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 클릭된 요소가 오버레이 자체인 경우에만 닫기 (내부 콘텐츠 클릭 시 닫히지 않도록)
    if (e.target === e.currentTarget) {
      console.log('[Highlight] 오버레이 클릭으로 모달 닫기');
      onClose();
    }
  }, [onClose]);

  // QR 코드 이미지 URL 생성 - minioQrPath를 우선 사용하고, 그 다음 qrValue로 생성
  const qrImageUrl = minioQrPath 
    ? minioQrPath 
    : qrValue 
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrValue)}` 
      : '';
  
  console.log('[Highlight] QR 이미지 URL:', qrImageUrl);

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <img src={closeIcon} alt="닫기" className={styles.closeIcon} />
        </button>
        
        <div className={styles.modalTitle}>
          {title}
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <img src={loadingIcon} alt="로딩 중" className={styles.loadingIcon} />
            <p>하이라이트 정보를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        ) : (
          <>
            <div className={styles.qrCodeContainer}>
              <div className={styles.qrCode}>
                {qrImageUrl ? (
                  <img 
                    src={qrImageUrl} 
                    alt="QR 코드" 
                    onError={(e) => {
                      console.error('[Highlight] QR 코드 이미지 로드 실패:', e);
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const errorMsg = document.createElement('p');
                        errorMsg.textContent = 'QR 코드를 표시할 수 없습니다.';
                        parent.appendChild(errorMsg);
                      }
                    }}
                  />
                ) : (
                  <p>QR 코드를 생성할 수 없습니다.</p>
                )}
              </div>
            </div>
            
            <div className={styles.videoInfo}>
              <p>영상은 24시간 후 자동 삭제됩니다.</p>
              
              {qrValue && (
                <button 
                  className={styles.downloadButton}
                  onClick={handleDownload}
                >
                  영상 다운로드
                </button>
              )}
              
              {(localPath || minioPath || formattedQrPath || minioQrPath) && (
                <div className={styles.pathInfo}>
                  {localPath && (
                    <div className={styles.pathItem}>
                      <span className={styles.pathLabel}>로컬 경로:</span>
                      <span className={styles.pathValue}>{localPath}</span>
                    </div>
                  )}
                  {minioPath && (
                    <div className={styles.pathItem}>
                      <span className={styles.pathLabel}>MinIO 경로:</span>
                      <span className={styles.pathValue}>{minioPath}</span>
                    </div>
                  )}
                  {formattedQrPath && (
                    <div className={styles.pathItem}>
                      <span className={styles.pathLabel}>QR 코드 로컬 경로:</span>
                      <span className={styles.pathValue}>{formattedQrPath}</span>
                    </div>
                  )}
                  {minioQrPath && (
                    <div className={styles.pathItem}>
                      <span className={styles.pathLabel}>QR 코드 MinIO 경로:</span>
                      <span className={styles.pathValue}>{minioQrPath}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Highlight;
