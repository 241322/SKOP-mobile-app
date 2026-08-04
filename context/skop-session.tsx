import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type Streak = {
  years: number;
  months: number;
  days: number;
};

type SkopSessionValue = {
  highScore: number;
  urgesSkopped: number;
  streak: Streak;
  recordHighScore: (score: number) => void;
  completeUrge: () => void;
  resetStreak: () => void;
};

const SkopSessionContext = createContext<SkopSessionValue | null>(null);

export function SkopSessionProvider({ children }: { children: ReactNode }) {
  const [highScore, setHighScore] = useState(2564);
  const [urgesSkopped, setUrgesSkopped] = useState(12);
  const [streak, setStreak] = useState<Streak>({ years: 4, months: 7, days: 28 });

  const value = useMemo(
    () => ({
      highScore,
      urgesSkopped,
      streak,
      recordHighScore: (score: number) => setHighScore((current) => Math.max(current, score)),
      completeUrge: () => setUrgesSkopped((current) => current + 1),
      resetStreak: () => setStreak({ years: 0, months: 0, days: 0 }),
    }),
    [highScore, streak, urgesSkopped]
  );

  return <SkopSessionContext.Provider value={value}>{children}</SkopSessionContext.Provider>;
}

export function useSkopSession() {
  const value = useContext(SkopSessionContext);

  if (!value) {
    throw new Error('useSkopSession must be used inside SkopSessionProvider');
  }

  return value;
}
