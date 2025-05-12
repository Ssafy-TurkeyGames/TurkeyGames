import React from 'react';
import styles from './FiveSecPlayerCard.module.css';

interface FiveSecPlayerCardProps {
  playerId: string;
  score: number;
  isCurrentPlayer: boolean;
  vote: 'approve' | 'reject' | null;
  onVote: (vote: 'approve' | 'reject') => void;
  isReady: boolean;
  onReady: () => void;
  canVote: boolean;
}

export default function FiveSecPlayerCard({ 
  playerId, 
  score, 
  isCurrentPlayer, 
  vote, 
  onVote, 
  isReady, 
  onReady,
  canVote
}: FiveSecPlayerCardProps): JSX.Element {
  return (
    <div className={`${styles.card} ${isCurrentPlayer ? styles.current : ''}`}>
      <div className={styles.playerInfo}>
        <h3>플레이어 {playerId}</h3>
        <div className={styles.score}>점수: {score}</div>
      </div>
      
      {!isCurrentPlayer && (
        <div className={styles.voteButtons}>
          <button 
            className={`${styles.voteButton} ${styles.approve} ${vote === 'approve' ? styles.selected : ''}`}
            onClick={() => onVote('approve')}
            disabled={!canVote || vote !== null}
          >
            찬성
          </button>
          <button 
            className={`${styles.voteButton} ${styles.reject} ${vote === 'reject' ? styles.selected : ''}`}
            onClick={() => onVote('reject')}
            disabled={!canVote || vote !== null}
          >
            반대
          </button>
        </div>
      )}
      
      {isReady && (
        <button className={styles.readyButton} onClick={onReady}>
          준비 완료!
        </button>
      )}
    </div>
  );
}