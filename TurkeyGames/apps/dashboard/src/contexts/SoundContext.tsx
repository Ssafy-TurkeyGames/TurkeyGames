// src/contexts/SoundContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface SoundContextType {
  isSoundOn: boolean;
  toggleSound: () => void;
  playSound: (sound: string) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSoundOn, setIsSoundOn] = useState(true);

  const toggleSound = () => {
    setIsSoundOn(prev => !prev);
  };

  export const playSound = (soundSrc: string) => {
   // console.log('playSound called with:', soundSrc);
   // console.log('Current sound enabled state:', isSoundEnabled);
    
    if (isSoundEnabled) {
     // console.log('Sound is enabled, playing sound');
      const audio = new Audio(soundSrc);
      audio.play()
        .then(() =>// console.log('Sound played successfully'))
        .catch(e => console.error("오디오 재생 실패:", e));
    } else {
     // console.log('Sound is disabled, not playing sound');
    }
  };

  return (
    <SoundContext.Provider value={{ isSoundOn, toggleSound, playSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = (): SoundContextType => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
