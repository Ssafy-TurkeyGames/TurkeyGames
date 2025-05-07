// apps/dashboard/src/pages/Rule/Rule.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './Rule.module.css';
import closeIcon from '../assets/images/close (1).png';
import { getGameRule } from '../api/dashboardApi';
import { GameRule } from '../api/types';


interface RuleProps {
  isModal?: boolean;
}

export default function Rule({ isModal = false }: RuleProps) {
  const { game_id } = useParams<{ game_id: string }>();
  const [gameRule, setGameRule] = useState<GameRule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGameRule = async () => {
      if (!game_id) {
        setError('게임 ID가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getGameRule(game_id);
        
        if (response.code === 'SUCCESS') {
          setGameRule(response.data);
          setError(null);
        } else {
          setError(response.message || '게임 규칙을 불러오는데 실패했습니다.');
          setGameRule(null);
        }
      } catch (err) {
        console.error('게임 규칙 조회 오류:', err);
        setError('서버 연결에 실패했습니다.');
        setGameRule(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGameRule();
  }, [game_id]);

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

  // 데이터 없음 케이스
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

  // 정상 데이터
  const { gameProfilePath, description, imagePath, descriptionVideoPath } = gameRule;

  return (
    <div className={isModal ? styles.modalOverlay : styles.container}>
      <div className={isModal ? styles.modalContent : undefined}>
        {/* 닫기 버튼 (모달일 때만) */}
        {isModal && (
          <button
            className={styles.closeBtn}
            onClick={() => navigate(-1)}
            aria-label="닫기"
            type="button"
          >
            <img src={closeIcon} alt="닫기" className={styles.closeIcon} />
          </button>
        )}
        
        {/* 게임 프로필 섹션 */}
        <section className={styles.profileSection}>
          <img 
            src={gameProfilePath || logo} 
            alt="게임 대표 이미지" 
            className={styles.profileImage}
            onError={(e) => {
              // 이미지 로드 실패 시 기본 이미지로 대체
              e.currentTarget.src = logo;
            }}
          />
        </section>

        {/* 설명 섹션 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📜 게임 규칙 설명</h2>
          <p className={styles.description}>{description}</p>
        </section>

        {/* 규칙 이미지 */}
        {imagePath && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🖼️ 규칙 이미지</h2>
            <img
              src={imagePath}
              alt="게임 규칙 이미지"
              className={styles.ruleImage}
              onError={(e) => {
                // 이미지 로드 실패 시 숨김 처리
                e.currentTarget.style.display = 'none';
              }}
            />
          </section>
        )}

        {/* 규칙 동영상 */}
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
              onClick={() => navigate(`/game-options/${game_id}`)}
            >
              ⚡ 게임 시작
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}