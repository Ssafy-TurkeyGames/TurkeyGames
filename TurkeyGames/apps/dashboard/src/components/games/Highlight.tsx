// apps/dashboard/src/components/games/Highlight.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Highlight.module.css';
import closeIcon from '../../assets/images/close (1).png'; // 닫기 아이콘

interface HighlightProps {
  isOpen: boolean;
  onClose: () => void;
  qrValue?: string;
  title?: string;
}

const Highlight: React.FC<HighlightProps> = ({ 
  isOpen, 
  onClose, 
  qrValue = 'http://k12e101.p.ssafy.io:9000/download/video/default', 
  title = 'QR코드를 인식하면 최고의 플레이 영상을 보실 수 있어요!' 
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          <img src={closeIcon} alt="닫기" className={styles.closeIcon} />
        </button>
        
        <div className={styles.modalTitle}>
          {title}
        </div>
        
        <div className={styles.qrCodeContainer}>
          {/* 외부 API를 사용하여 QR 코드 생성 */}
          <div className={styles.qrCode}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrValue)}`} 
              alt="QR 코드" 
            />
          </div>
        </div>
        
        <div className={styles.videoInfo}>
          <p>영상은 24시간 후 자동 삭제됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default Highlight;
