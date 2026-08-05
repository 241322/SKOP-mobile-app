import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/auth';

export type SpendPeriod = 'daily' | 'weekly' | 'monthly';

export type QuitPlan = {
  quitDate: string;
  spendPeriod: SpendPeriod;
  spendAmount: number;
};

export type SkopSessionRecord = {
  id: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  score: number;
  highestLevel: number;
};

type NewSkopSession = Omit<SkopSessionRecord, 'id'>;

type Streak = {
  years: number;
  months: number;
  days: number;
};

type SkopSessionValue = {
  highScore: number;
  sessions: SkopSessionRecord[];
  skopSessionCount: number;
  totalSessionSeconds: number;
  averageSessionSeconds: number;
  lastSessionAt: string | null;
  streak: Streak;
  daysSmokeFree: number;
  moneySaved: number;
  quitPlan: QuitPlan | null;
  profileLoading: boolean;
  completeOnboarding: (plan: QuitPlan) => Promise<void>;
  recordHighScore: (score: number) => void;
  completeSession: (session: NewSkopSession) => void;
  resetStreak: () => void;
};

// creates one place for screens to read session and quit plan data
const SkopSessionContext = createContext<SkopSessionValue | null>(null);

export function SkopSessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // game values will move to firestore with the quit plan
  const [highScore, setHighScore] = useState(2564);
  const [sessions, setSessions] = useState<SkopSessionRecord[]>([]);
  const [quitPlan, setQuitPlan] = useState<QuitPlan | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const profileLoading = Boolean(user && loadedUserId !== user.uid);

  // local storage keeps onboarding working until firestore is connected
  useEffect(() => {
    let active = true;

    if (!user) {
      setQuitPlan(null);
      setSessions([]);
      setLoadedUserId(null);
      return;
    }

    setLoadedUserId(null);
    Promise.all([
      AsyncStorage.getItem(`quit-plan-${user.uid}`),
      AsyncStorage.getItem(`skop-sessions-${user.uid}`),
    ])
      .then(([storedPlan, storedSessions]) => {
        if (!active) return;
        setQuitPlan(storedPlan ? (JSON.parse(storedPlan) as QuitPlan) : null);
        setSessions(storedSessions ? (JSON.parse(storedSessions) as SkopSessionRecord[]) : []);
      })
      .catch(() => {
        if (!active) return;
        setQuitPlan(null);
        setSessions([]);
      })
      .finally(() => {
        if (active) setLoadedUserId(user.uid);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const streakData = useMemo(() => calculateStreak(quitPlan?.quitDate), [quitPlan?.quitDate]);
  const moneySaved = useMemo(
    () => calculateMoneySaved(quitPlan, streakData.totalDays),
    [quitPlan, streakData.totalDays]
  );
  const totalSessionSeconds = useMemo(
    () => sessions.reduce((total, session) => total + session.durationSeconds, 0),
    [sessions]
  );
  const averageSessionSeconds =
    sessions.length > 0 ? Math.round(totalSessionSeconds / sessions.length) : 0;

  // only rebuilds the shared value when its data changes
  const value = useMemo(
    () => ({
      highScore,
      sessions,
      skopSessionCount: sessions.length,
      totalSessionSeconds,
      averageSessionSeconds,
      lastSessionAt: sessions[0]?.endedAt ?? null,
      streak: streakData.streak,
      daysSmokeFree: streakData.totalDays,
      moneySaved,
      quitPlan,
      profileLoading,
      completeOnboarding: async (plan: QuitPlan) => {
        if (!user) return;
        await AsyncStorage.setItem(`quit-plan-${user.uid}`, JSON.stringify(plan));
        setQuitPlan(plan);
      },
      recordHighScore: (score: number) => setHighScore((current) => Math.max(current, score)),
      completeSession: (session: NewSkopSession) => {
        if (!user) return;

        setSessions((current) => {
          const nextSessions = [{ ...session, id: session.endedAt }, ...current].slice(0, 500);
          void AsyncStorage.setItem(`skop-sessions-${user.uid}`, JSON.stringify(nextSessions));
          return nextSessions;
        });
      },
      resetStreak: () => {
        if (!user || !quitPlan) return;
        const resetPlan = { ...quitPlan, quitDate: dateToInputValue(new Date()) };
        setQuitPlan(resetPlan);
        void AsyncStorage.setItem(`quit-plan-${user.uid}`, JSON.stringify(resetPlan));
      },
    }),
    [
      averageSessionSeconds,
      highScore,
      moneySaved,
      profileLoading,
      quitPlan,
      sessions,
      streakData,
      totalSessionSeconds,
      user,
    ]
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

function calculateMoneySaved(plan: QuitPlan | null, daysSmokeFree: number) {
  if (!plan) return 0;

  const dailySpend =
    plan.spendPeriod === 'daily'
      ? plan.spendAmount
      : plan.spendPeriod === 'weekly'
        ? plan.spendAmount / 7
        : (plan.spendAmount * 12) / 365.25;

  return Math.floor(dailySpend * daysSmokeFree);
}

function calculateStreak(quitDate?: string) {
  if (!quitDate) {
    return { streak: { years: 0, months: 0, days: 0 }, totalDays: 0 };
  }

  const start = inputValueToDate(quitDate);
  const today = startOfDay(new Date());
  const totalDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));

  let years = today.getFullYear() - start.getFullYear();
  if (addYearsClamped(start, years) > today) years -= 1;

  const afterYears = addYearsClamped(start, years);
  let months = 0;
  while (addMonthsClamped(afterYears, months + 1) <= today) months += 1;

  const afterMonths = addMonthsClamped(afterYears, months);
  const days = Math.floor((today.getTime() - afterMonths.getTime()) / 86400000);

  return {
    streak: { years: Math.max(0, years), months, days },
    totalDays,
  };
}

function addYearsClamped(date: Date, years: number) {
  const year = date.getFullYear() + years;
  const month = date.getMonth();
  const day = Math.min(date.getDate(), daysInMonth(year, month));
  return new Date(year, month, day);
}

function addMonthsClamped(date: Date, months: number) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const day = Math.min(date.getDate(), daysInMonth(firstOfMonth.getFullYear(), firstOfMonth.getMonth()));
  return new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), day);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function inputValueToDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateToInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
