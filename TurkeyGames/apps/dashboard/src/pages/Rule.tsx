import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './Rule.module.css';
import closeIcon from '../assets/images/close (1).png';
import logo from '../assets/images/logo.png';
import { getGameRule } from '../api/dashboardApi';
import { GameRule } from '../api/types';
import defaultRuleImage from '../assets/images/rule_default.png';

interface RuleProps {
  isModal?: boolean;
  modalGameId?: string | number; // 모달로 사용될 때 gameId를 props로 받음
  onClose?: () => void; // 모달 닫기 함수 추가
  showButtons?: boolean; // 버튼 표시 여부를 직접 제어
}

export default function Rule({ isModal = false, modalGameId, onClose, showButtons = true }: RuleProps) {
  const { gameId: urlGameId } = useParams<{ gameId: string }>();
  const [gameRule, setGameRule] = useState<GameRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // URL 파라미터 또는 props로 전달된 gameId 사용
  const effectiveGameId = modalGameId || urlGameId;

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    // 모달로 사용되고 onClose 함수가 전달된 경우 해당 함수 호출
    if (isModal && onClose) {
      onClose();
    } else {
      // 일반 페이지로 사용된 경우 이전 페이지로 이동
      navigate(-1);
    }
  }, [isModal, onClose, navigate]);

  // 모달 오버레이 클릭 핸들러 - 모달 바깥 영역 클릭 시 닫기
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 클릭된 요소가 오버레이 자체인 경우에만 닫기 (내부 콘텐츠 클릭 시 닫히지 않도록)
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (!effectiveGameId) {
      setError('게임 ID가 없습니다.');
      setLoading(false);
      return;
    }

    const fetchRule = async () => {
      try {
        setLoading(true);
        const res = await getGameRule(effectiveGameId);
        if (res.code === 'SUCCESS' && res.data) {
          setGameRule(res.data);
          setError(null);
        } else {
          setError(res.message || '게임 규칙을 불러오는데 실패했습니다.');
          setGameRule(null);
        }
      } catch (e) {
        setError('서버 연결에 실패했습니다.');
        setGameRule(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRule();
  }, [effectiveGameId]);

  if (loading) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2 className={styles.error}>⚠️ {error}</h2>
        <Link to="/search" className={styles.backButton}>
          ← 검색 화면으로 돌아가기
        </Link>
      </div>
    );
  }

  if (!gameRule) {
    return (
      <div className={styles.container}>
        <h2 className={styles.error}>📜 해당 게임의 규칙이 존재하지 않습니다</h2>
        <Link to="/search" className={styles.backButton}>
          ← 다른 게임 보기
        </Link>
      </div>
    );
  }

  const { gameProfilePath, description, imagePath, descriptionVideoPath } = gameRule;

  // URL 유효성 검사 함수
  const isValidUrl = (url: string): boolean => {
    try {
      return url.startsWith('http://') || url.startsWith('https://');
    } catch (e) {
      return false;
    }
  };

  // 이미지 경로 처리 - 배열인 경우 첫 번째 유효한 URL 사용
  const getImageUrl = (): string | null => {
    if (!imagePath) return null;
    
    // 배열인 경우
    if (Array.isArray(imagePath)) {
      // 배열에서 첫 번째 유효한 URL 찾기
      for (const url of imagePath) {
        if (isValidUrl(url)) {
          return url;
        }
      }
      return null; // 유효한 URL이 없으면 null 반환
    }
    
    // 문자열인 경우 URL 유효성 검사
    return isValidUrl(imagePath) ? imagePath : null;
  };

  const validImageUrl = getImageUrl();

  return (
  <div 
    className={isModal ? styles.modalOverlay : styles.container}
    onClick={isModal ? handleOverlayClick : undefined}
  >
    <div className={isModal ? styles.modalContent : undefined}>
      {isModal && (
        <div className={styles.closeBtnContainer}>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="닫기"
            type="button"
          >
            <img src={closeIcon} alt="닫기" className={styles.closeIcon} />
          </button>
        </div>
      )}

      <section className={styles.profileSection}>
        <img
          src={gameProfilePath || logo}
          alt="게임 대표 이미지"
          className={styles.profileImage}
          onError={(e) => {
            e.currentTarget.src = logo;
            e.currentTarget.onerror = null;
          }}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📜 게임 규칙 설명</h2>
        <p className={styles.description}>{description}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🖼️ 규칙 이미지</h2>
        <img
          src={validImageUrl || defaultRuleImage}
          alt="게임 규칙 이미지"
          className={styles.ruleImage}
          onError={(e) => {
            e.currentTarget.src = defaultRuleImage;
            e.currentTarget.onerror = null;
          }}
        />
      </section>

      {descriptionVideoPath && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🎥 규칙 동영상</h2>
          <div className={styles.videoWrapper}>
            <iframe
              src={descriptionVideoPath}
              title="게임 규칙 동영상"
              className={styles.video}
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* showButtons prop이 true이거나 정의되지 않은 경우에만 버튼 섹션 표시 */}
      {(showButtons !== false) && (
        <section className={styles.buttonSection}>
          <div className={styles.buttonGroup}>
            {!isModal ? (
              <Link to="/search" className={styles.backButton}>
                ← 목록으로 돌아가기
              </Link>
            ) : (
              <button onClick={handleClose} className={styles.backButton}>
                ← 닫기
              </button>
            )}
          </div>
          <div className={styles.buttonGroup}>
            <button
              className={styles.backButton}
              onClick={() => navigate(`/game-options/${effectiveGameId}`)}
            >
              ⚡ 게임 시작
            </button>
          </div>
        </section>
      )}
    </div>
  </div>
);

}
