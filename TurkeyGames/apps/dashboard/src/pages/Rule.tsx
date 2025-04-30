// apps/dashboard/src/pages/Rule/Rule.tsx
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './Rule.module.css';
import closeIcon from '../assets/images/close (1).png';

// API 명세에 맞는 더미 데이터
const mockApiResponse = {
  code: "SUCCESS",
  message: "Games retrieved successfully.",
  data: {
    game_id: 1,
    gameProfilePath: "https://example.com/images/dice_profile.jpg",
    description: "주사위 5개를 사용해 포커처럼 '족보'를 만드는 게임이다. 주사위를 최대 세 번까지 던져서 맞는 족보를 만든 후, 최대 점수를 얻어내는 게 목표!",
    imagePath: "https://example.com/images/rule1.jpg",
    descriptionVideoPath: "https://youtube.com/embed/dice_game"
  }
};

// 데이터 없음 응답
const mockNoDataResponse = {
  code: "SUCCESS",
  message: "No games found.",
  data: []
};

// 서버 오류 응답
const mockErrorResponse = {
  code: "INTERNAL_SERVER_ERROR",
  message: "An unexpected error occurred.",
  data: null
};

export default function Rule({ isModal = false }) {
  const { game_id } = useParams();
  const [apiData, setApiData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    // API 호출 대신 api 명세서 기반으로 더미데이터 만들었음
    setLoading(true);
    setError(false);

    setTimeout(() => {
      // 아래에서 원하는 더미 응답으로 바꿔 테스트 가능
      // setApiData(mockErrorResponse);
      // setApiData(mockNoDataResponse);
      setApiData(mockApiResponse);
      setLoading(false);
    }, 400);
  }, [game_id]);

  if (loading) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  if (error || apiData?.code === "INTERNAL_SERVER_ERROR") {
    return (
      <div className={styles.container}>
        <h2 className={styles.error}>⚠️ {apiData?.message || '서버 연결 실패'}</h2>
        <Link to="/search" className={styles.backButton}>
          ← 검색 화면으로 돌아가기
        </Link>
      </div>
    );
  }

  // 데이터 없음 케이스
  if (!apiData?.data || Array.isArray(apiData.data) && apiData.data.length === 0) {
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
  const { gameProfilePath, description, imagePath, descriptionVideoPath, game_id: id } = apiData.data;

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
          src={gameProfilePath} 
          alt="게임 대표 이미지" 
          className={styles.profileImage}
        //   onError={(e) => {
        //     (e.target as HTMLImageElement).src = '/fallback-image.jpg';
        //   }}
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
          ←  목록으로 돌아가기
        </Link>
      </div>
      <div className={styles.buttonGroup}>
        <Link to="/search" className={styles.backButton}>
        ⚡ 게임 시작
        </Link>
      </div>
      </section>
      </div>
    </div>
  );
}
