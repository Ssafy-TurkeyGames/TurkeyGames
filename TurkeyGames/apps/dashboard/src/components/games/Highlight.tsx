// apps/dashboard/src/components/games/Highlight.tsx
import React from 'react';
import styles from './Highlight.module.css';
import closeIcon from '../../assets/images/close (1).png'; // 닫기 아이콘
import loadingIcon from '../../assets/images/loading.png'; // 로딩 스피너 이미지 필요

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
  localQrPath
}) => {
  console.log('[Highlight] 렌더링 시작');
  console.log('[Highlight] Props:', { isOpen, qrValue, title, loading, error, localPath, minioPath, localQrPath });
  
  if (!isOpen) return null;

  // local_qr_path가 C:/로 시작하지 않으면 앞에 C:/를 추가
  const formattedQrPath = localQrPath && !localQrPath.startsWith('C:/') 
    ? `C:/${localQrPath}` 
    : localQrPath;
  
  console.log('[Highlight] 포맷된 QR 경로:', formattedQrPath);

  const handleDownload = () => {
    console.log('[Highlight] 다운로드 버튼 클릭, URL:', qrValue);
    if (qrValue) {
      window.open(qrValue, '_blank');
    }
  };

  // QR 코드 이미지 URL 생성
  const qrImageUrl = formattedQrPath 
    ? formattedQrPath 
    : qrValue 
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrValue)}` 
      : '';
  
  console.log('[Highlight] QR 이미지 URL:', qrImageUrl);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
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
              {/* QR 코드 표시 - 서버에서 제공한 QR 코드 경로가 있으면 사용, 없으면 API로 생성 */}
              <div className={styles.qrCode}>
                {qrImageUrl ? (
                  <img 
                    src={qrImageUrl} 
                    alt="QR 코드" 
                    onError={(e) => {
                      console.error('[Highlight] QR 코드 이미지 로드 실패:', e);
                      // 이미지 로드 실패 시 대체 이미지 또는 메시지 표시
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
              
              {(localPath || minioPath || formattedQrPath) && (
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
