import React, { useState, useEffect } from 'react';
import styles from './FiveSecTimer.module.css';

interface FiveSecTimerProps {
  isRunning: boolean;
  onComplete: () => void;
}

export default function FiveSecTimer({ isRunning, onComplete }: FiveSecTimerProps): JSX.Element {
  const [timeLeft, setTimeLeft] = useState<number>(5);
  
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(5); // 타이머가 멈추면 항상 5초로 리셋
      return;
    }
    
    // 타이머가 시작될 때 5초로 설정
    setTimeLeft(5);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(timer);
      setTimeLeft(5); // 컴포넌트 unmount시에도 5초로 리셋
    };
  }, [isRunning, onComplete]);
  
  return (
    <div className={styles.timer}>
      {timeLeft}
    </div>
  );
}