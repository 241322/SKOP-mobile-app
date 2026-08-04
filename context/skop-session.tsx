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

// creates one place for screens to read session data
const SkopSessionContext = createContext<SkopSessionValue | null>(null);

export function SkopSessionProvider({ children }: { children: ReactNode }) {
  // these values will come from firebase later
  const [highScore, setHighScore] = useState(2564);
  const [urgesSkopped, setUrgesSkopped] = useState(12);
  const [streak, setStreak] = useState<Streak>({ years: 4, months: 7, days: 28 });

  // only rebuilds the shared value when its data changes
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

// gives screens a short way to use the session
export function useSkopSession() {
  const value = useContext(SkopSessionContext);

  if (!value) {
    throw new Error('useSkopSession must be used inside SkopSessionProvider');
  }

  return value;
}
