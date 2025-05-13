// apps/dashboard/src/pages/Rule.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './Rule.module.css';
import closeIcon from '../assets/images/close (1).png';
import logo from '../assets/images/logo.png';
import { getGameRule } from '../api/dashboardApi';
import { GameRule } from '../api/types';

interface RuleProps {
  isModal?: boolean;
}

export default function Rule({ isModal = false }: RuleProps) {
  const { gameId } = useParams<{ gameId: string }>();
  const [gameRule, setGameRule] = useState<GameRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // 모달 오버레이 클릭 핸들러 - 모달 바깥 영역 클릭 시 닫기
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 클릭된 요소가 오버레이 자체인 경우에만 닫기 (내부 콘텐츠 클릭 시 닫히지 않도록)
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (!gameId) {
      setError('게임 ID가 없습니다.');
      setLoading(false);
      return;
    }

    const fetchRule = async () => {
      try {
        setLoading(true);
        const res = await getGameRule(gameId);
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
  }, [gameId]);

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

  return (
    <div 
      className={isModal ? styles.modalOverlay : styles.container}
      onClick={isModal ? handleOverlayClick : undefined}
    >
      <div className={isModal ? styles.modalContent : undefined}>
        {isModal && (
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="닫기"
            type="button"
          >
            <img src={closeIcon} alt="닫기" className={styles.closeIcon} />
          </button>
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

        {imagePath && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🖼️ 규칙 이미지</h2>
            <img
              src={imagePath}
              alt="게임 규칙 이미지"
              className={styles.ruleImage}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </section>
        )}

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

        <section className={styles.buttonSection}>
          <div className={styles.buttonGroup}>
            <Link to="/search" className={styles.backButton}>
              ← 목록으로 돌아가기
            </Link>
          </div>
          <div className={styles.buttonGroup}>
            <button
              className={styles.backButton}
              onClick={() => navigate(`/game-options/${gameId}`)}
            >
              ⚡ 게임 시작
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
