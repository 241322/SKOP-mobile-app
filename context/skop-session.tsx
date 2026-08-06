import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/context/auth';
import {
  type CheckInCadence,
  type LegacyQuitPlan,
  loadFirestoreCheckIns,
  loadFirestoreProfile,
  loadFirestoreSessions,
  type LoadedProfile,
  type ProductType,
  type QuitPlan,
  saveFirestoreCheckIn,
  saveFirestoreProfile,
  saveFirestoreSession,
  type SkopSessionRecord,
  type SpendCheckIn,
} from '@/lib/skop-firestore';
import { applyCheckInReminder, clearCheckInReminder } from '@/lib/skop-notifications';

export type {
  CheckInCadence,
  ProductType,
  QuitJourney,
  QuitPlan,
  QuitStatus,
  ReminderTime,
  SkopSessionRecord,
  SpendCheckIn,
  SpendPeriod,
} from '@/lib/skop-firestore';

type NewSkopSession = Omit<SkopSessionRecord, 'id'>;

type Streak = {
  years: number;
  months: number;
  days: number;
};

type DataSyncStatus = 'syncing' | 'synced' | 'offline';

type SkopSessionValue = {
  highScore: number;
  sessions: SkopSessionRecord[];
  spendCheckIns: SpendCheckIn[];
  skopSessionCount: number;
  totalSessionSeconds: number;
  averageSessionSeconds: number;
  lastSessionAt: string | null;
  streak: Streak;
  daysSmokeFree: number;
  moneySaved: number;
  latestSpendChangeCents: number | null;
  checkInDue: boolean;
  quitPlan: QuitPlan | null;
  legacyPlan: LegacyQuitPlan | null;
  profileNeedsMigration: boolean;
  profileLoading: boolean;
  dataSyncStatus: DataSyncStatus;
  refreshCloudData: () => Promise<void>;
  completeOnboarding: (plan: QuitPlan) => Promise<void>;
  migrateProfile: (productType: ProductType, ageConfirmedAt: string) => Promise<void>;
  updateQuitPlan: (plan: QuitPlan) => Promise<void>;
  confirmQuit: (quitDate: string) => Promise<void>;
  saveSpendCheckIn: (amount: number) => Promise<void>;
  recordHighScore: (score: number) => void;
  completeSession: (session: NewSkopSession) => void;
  resetStreak: () => void;
};

// creates one place for screens to read profile, check-ins and game sessions
const SkopSessionContext = createContext<SkopSessionValue | null>(null);

export function SkopSessionProvider({ children }: { children: ReactNode }) {
  const { emailVerified, user } = useAuth();
  const [highScore, setHighScore] = useState(0);
  const [sessions, setSessions] = useState<SkopSessionRecord[]>([]);
  const [spendCheckIns, setSpendCheckIns] = useState<SpendCheckIn[]>([]);
  const [quitPlan, setQuitPlan] = useState<QuitPlan | null>(null);
  const [legacyPlan, setLegacyPlan] = useState<LegacyQuitPlan | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [dataSyncStatus, setDataSyncStatus] = useState<DataSyncStatus>('syncing');
  const profileLoading = Boolean(user && emailVerified && loadedUserId !== user.uid);

  // refs let sync jobs use current state without rebuilding their timers
  const sessionsRef = useRef<SkopSessionRecord[]>([]);
  const checkInsRef = useRef<SpendCheckIn[]>([]);
  const quitPlanRef = useRef<QuitPlan | null>(null);
  const legacyPlanRef = useRef<LegacyQuitPlan | null>(null);
  const syncRunningRef = useRef(false);

  const setCachedProfile = useCallback((profile: LoadedProfile | null) => {
    if (profile?.profileVersion === 2) {
      quitPlanRef.current = profile;
      legacyPlanRef.current = null;
      setQuitPlan(profile);
      setLegacyPlan(null);
      return;
    }

    quitPlanRef.current = null;
    legacyPlanRef.current = profile;
    setQuitPlan(null);
    setLegacyPlan(profile);
  }, []);

  const setCachedSessions = useCallback((nextSessions: SkopSessionRecord[]) => {
    const sortedSessions = sortSessions(nextSessions);
    sessionsRef.current = sortedSessions;
    setSessions(sortedSessions);
    setHighScore(sortedSessions.reduce((highest, session) => Math.max(highest, session.score), 0));
  }, []);

  const setCachedCheckIns = useCallback((nextCheckIns: SpendCheckIn[]) => {
    const sortedCheckIns = sortCheckIns(nextCheckIns);
    checkInsRef.current = sortedCheckIns;
    setSpendCheckIns(sortedCheckIns);
  }, []);

  // login loads phone data first and merges each collection with firestore
  useEffect(() => {
    let active = true;

    if (!user || !emailVerified) {
      setCachedProfile(null);
      setCachedSessions([]);
      setCachedCheckIns([]);
      setLoadedUserId(null);
      setDataSyncStatus('syncing');
      return;
    }

    const userId = user.uid;
    setLoadedUserId(null);

    const loadUserData = async () => {
      let cloudFailed = false;
      const [storedProfile, storedSessions, storedCheckIns, profilePending] = await Promise.all([
        AsyncStorage.getItem(profileKey(userId)),
        AsyncStorage.getItem(sessionsKey(userId)),
        AsyncStorage.getItem(checkInsKey(userId)),
        AsyncStorage.getItem(profilePendingKey(userId)),
      ]);
      let nextProfile = parseProfile(storedProfile);
      let nextSessions = parseSessions(storedSessions);
      let nextCheckIns = parseCheckIns(storedCheckIns);

      try {
        if (profilePending === 'true' && nextProfile?.profileVersion === 2) {
          await saveFirestoreProfile(userId, nextProfile);
          await AsyncStorage.removeItem(profilePendingKey(userId));
        } else {
          const cloudProfile = await loadFirestoreProfile(userId);
          if (cloudProfile) {
            nextProfile = cloudProfile;
          } else if (nextProfile?.profileVersion === 2) {
            await saveFirestoreProfile(userId, nextProfile);
          }
        }
      } catch {
        cloudFailed = true;
      }

      try {
        const [cloudSessions, cloudCheckIns] = await Promise.all([
          loadFirestoreSessions(userId),
          loadFirestoreCheckIns(userId),
        ]);
        await Promise.allSettled([
          ...phoneOnly(nextSessions, cloudSessions).map((session) =>
            saveFirestoreSession(userId, session)
          ),
          ...phoneOnly(nextCheckIns, cloudCheckIns).map((checkIn) =>
            saveFirestoreCheckIn(userId, checkIn)
          ),
        ]);
        nextSessions = mergeById(nextSessions, cloudSessions).slice(0, 500);
        nextCheckIns = sortCheckIns(mergeById(nextCheckIns, cloudCheckIns)).slice(0, 500);
      } catch {
        cloudFailed = true;
      }

      await Promise.all([
        nextProfile
          ? AsyncStorage.setItem(profileKey(userId), JSON.stringify(nextProfile))
          : Promise.resolve(),
        AsyncStorage.setItem(sessionsKey(userId), JSON.stringify(nextSessions)),
        AsyncStorage.setItem(checkInsKey(userId), JSON.stringify(nextCheckIns)),
      ]);

      if (!active) return;
      setCachedProfile(nextProfile);
      setCachedSessions(nextSessions);
      setCachedCheckIns(nextCheckIns);
      setLoadedUserId(userId);
      setDataSyncStatus(cloudFailed ? 'offline' : 'synced');
    };

    loadUserData().catch(() => {
      if (active) {
        setLoadedUserId(userId);
        setDataSyncStatus('offline');
      }
    });

    return () => {
      active = false;
    };
  }, [emailVerified, setCachedCheckIns, setCachedProfile, setCachedSessions, user]);

  // foreground and timer syncs retry phone records that have not reached firestore
  const syncCloudData = useCallback(async () => {
    if (!user || !emailVerified || syncRunningRef.current) return;
    syncRunningRef.current = true;
    setDataSyncStatus('syncing');
    const userId = user.uid;

    try {
      const currentPlan = quitPlanRef.current;
      const profilePending = await AsyncStorage.getItem(profilePendingKey(userId));
      if (currentPlan && profilePending === 'true') {
        await saveFirestoreProfile(userId, currentPlan);
        await AsyncStorage.removeItem(profilePendingKey(userId));
      } else {
        const cloudProfile = await loadFirestoreProfile(userId);
        if (cloudProfile) {
          setCachedProfile(cloudProfile);
          await AsyncStorage.setItem(profileKey(userId), JSON.stringify(cloudProfile));
        } else if (currentPlan) {
          await saveFirestoreProfile(userId, currentPlan);
        }
      }

      const [cloudSessions, cloudCheckIns] = await Promise.all([
        loadFirestoreSessions(userId),
        loadFirestoreCheckIns(userId),
      ]);
      await Promise.allSettled([
        ...phoneOnly(sessionsRef.current, cloudSessions).map((session) =>
          saveFirestoreSession(userId, session)
        ),
        ...phoneOnly(checkInsRef.current, cloudCheckIns).map((checkIn) =>
          saveFirestoreCheckIn(userId, checkIn)
        ),
      ]);

      const mergedSessions = mergeById(sessionsRef.current, cloudSessions).slice(0, 500);
      const mergedCheckIns = sortCheckIns(
        mergeById(checkInsRef.current, cloudCheckIns)
      ).slice(0, 500);
      setCachedSessions(mergedSessions);
      setCachedCheckIns(mergedCheckIns);
      await Promise.all([
        AsyncStorage.setItem(sessionsKey(userId), JSON.stringify(mergedSessions)),
        AsyncStorage.setItem(checkInsKey(userId), JSON.stringify(mergedCheckIns)),
      ]);
      setDataSyncStatus('synced');
    } catch {
      setDataSyncStatus('offline');
    } finally {
      syncRunningRef.current = false;
    }
  }, [
    emailVerified,
    setCachedCheckIns,
    setCachedProfile,
    setCachedSessions,
    user,
  ]);

  useEffect(() => {
    if (!user || !emailVerified) return;

    const timer = setInterval(() => void syncCloudData(), 30000);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncCloudData();
    });

    return () => {
      clearInterval(timer);
      appStateSubscription.remove();
    };
  }, [emailVerified, syncCloudData, user]);

  // changing a reminder preference replaces the one local schedule on this phone
  useEffect(() => {
    if (!quitPlan) {
      void clearCheckInReminder();
      return;
    }
    void applyCheckInReminder(quitPlan);
  }, [quitPlan]);

  const persistPlan = useCallback(
    async (plan: QuitPlan) => {
      if (!user) return;
      const userId = user.uid;
      await Promise.all([
        AsyncStorage.setItem(profileKey(userId), JSON.stringify(plan)),
        AsyncStorage.setItem(profilePendingKey(userId), 'true'),
      ]);
      setCachedProfile(plan);

      try {
        await saveFirestoreProfile(userId, plan);
        await AsyncStorage.removeItem(profilePendingKey(userId));
      } catch {
        // the foreground sync keeps the pending marker
      }
    },
    [setCachedProfile, user]
  );

  const streakData = useMemo(
    () => calculateStreak(quitPlan?.status === 'quit' ? quitPlan.quitDate : null),
    [quitPlan]
  );
  const moneySaved = useMemo(
    () => calculateMoneySaved(quitPlan, streakData.totalDays),
    [quitPlan, streakData.totalDays]
  );
  const latestSpendChangeCents =
    spendCheckIns.length > 0
      ? spendCheckIns[0].expectedBaselineCents - spendCheckIns[0].amountCents
      : null;
  const checkInDue = useMemo(() => {
    if (!quitPlan?.checkInCadence || quitPlan.status !== 'reducing') return false;
    const period = getCompletedPeriod(quitPlan.checkInCadence);
    return !spendCheckIns.some((checkIn) => checkIn.id === period.id);
  }, [quitPlan, spendCheckIns]);
  const totalSessionSeconds = useMemo(
    () => sessions.reduce((total, session) => total + session.durationSeconds, 0),
    [sessions]
  );
  const averageSessionSeconds =
    sessions.length > 0 ? Math.round(totalSessionSeconds / sessions.length) : 0;

  const value = useMemo<SkopSessionValue>(
    () => ({
      highScore,
      sessions,
      spendCheckIns,
      skopSessionCount: sessions.length,
      totalSessionSeconds,
      averageSessionSeconds,
      lastSessionAt: sessions[0]?.endedAt ?? null,
      streak: streakData.streak,
      daysSmokeFree: streakData.totalDays,
      moneySaved,
      latestSpendChangeCents,
      checkInDue,
      quitPlan,
      legacyPlan,
      profileNeedsMigration: Boolean(legacyPlan),
      profileLoading,
      dataSyncStatus,
      refreshCloudData: syncCloudData,
      completeOnboarding: persistPlan,
      migrateProfile: async (productType, ageConfirmedAt) => {
        const currentLegacy = legacyPlanRef.current;
        if (!currentLegacy) return;
        await persistPlan({
          profileVersion: 2,
          productType,
          journey: 'already_quit',
          status: 'quit',
          quitDate: currentLegacy.quitDate,
          targetQuitDate: null,
          spendPeriod: currentLegacy.spendPeriod,
          spendAmount: currentLegacy.spendAmount,
          checkInCadence: null,
          remindersEnabled: false,
          reminderTime: null,
          ageConfirmedAt,
        });
      },
      updateQuitPlan: persistPlan,
      confirmQuit: async (quitDate) => {
        const currentPlan = quitPlanRef.current;
        if (!currentPlan) return;
        await persistPlan({
          ...currentPlan,
          status: 'quit',
          quitDate,
          targetQuitDate: null,
          remindersEnabled: false,
        });
      },
      saveSpendCheckIn: async (amount) => {
        const currentPlan = quitPlanRef.current;
        if (!user || !currentPlan?.checkInCadence || currentPlan.status !== 'reducing') return;
        const period = getCompletedPeriod(currentPlan.checkInCadence);
        const checkIn: SpendCheckIn = {
          id: period.id,
          periodStart: period.start,
          periodEnd: period.end,
          amountCents: Math.round(amount * 100),
          expectedBaselineCents: calculateExpectedBaselineCents(
            currentPlan,
            period.dayCount
          ),
          cadence: currentPlan.checkInCadence,
          createdAt: new Date().toISOString(),
        };
        const nextCheckIns = sortCheckIns(mergeById([checkIn], checkInsRef.current)).slice(0, 500);
        setCachedCheckIns(nextCheckIns);
        await AsyncStorage.setItem(checkInsKey(user.uid), JSON.stringify(nextCheckIns));
        void saveFirestoreCheckIn(user.uid, checkIn).catch(() => undefined);
      },
      recordHighScore: (score) => setHighScore((current) => Math.max(current, score)),
      completeSession: (session) => {
        if (!user) return;
        const newSession = {
          ...session,
          id: `session-${new Date(session.startedAt).getTime()}`,
        };
        const nextSessions = sortSessions(
          mergeById([newSession], sessionsRef.current)
        ).slice(0, 500);
        setCachedSessions(nextSessions);
        void AsyncStorage.setItem(sessionsKey(user.uid), JSON.stringify(nextSessions));
        void saveFirestoreSession(user.uid, newSession).catch(() => undefined);
      },
      resetStreak: () => {
        const currentPlan = quitPlanRef.current;
        if (!currentPlan) return;
        void persistPlan({
          ...currentPlan,
          journey: 'already_quit',
          status: 'quit',
          quitDate: dateToInputValue(new Date()),
          targetQuitDate: null,
          remindersEnabled: false,
        });
      },
    }),
    [
      averageSessionSeconds,
      checkInDue,
      dataSyncStatus,
      highScore,
      latestSpendChangeCents,
      legacyPlan,
      moneySaved,
      persistPlan,
      profileLoading,
      quitPlan,
      sessions,
      setCachedCheckIns,
      setCachedSessions,
      spendCheckIns,
      streakData,
      syncCloudData,
      totalSessionSeconds,
      user,
    ]
  );

  return <SkopSessionContext.Provider value={value}>{children}</SkopSessionContext.Provider>;
}

export function useSkopSession() {
  const value = useContext(SkopSessionContext);
  if (!value) throw new Error('useSkopSession must be used inside SkopSessionProvider');
  return value;
}

function profileKey(userId: string) {
  return `quit-plan-${userId}`;
}

function profilePendingKey(userId: string) {
  return `quit-plan-pending-${userId}`;
}

function sessionsKey(userId: string) {
  return `skop-sessions-${userId}`;
}

function checkInsKey(userId: string) {
  return `skop-spend-check-ins-${userId}`;
}

function parseProfile(value: string | null): LoadedProfile | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (parsed.profileVersion === 2) return parsed as QuitPlan;
    if (
      typeof parsed.quitDate === 'string' &&
      typeof parsed.spendPeriod === 'string' &&
      typeof parsed.spendAmount === 'number'
    ) {
      return {
        profileVersion: 1,
        quitDate: parsed.quitDate,
        spendPeriod: parsed.spendPeriod as LegacyQuitPlan['spendPeriod'],
        spendAmount: parsed.spendAmount,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function parseSessions(value: string | null): SkopSessionRecord[] {
  return parseArray<SkopSessionRecord>(value);
}

function parseCheckIns(value: string | null): SpendCheckIn[] {
  return parseArray<SpendCheckIn>(value);
}

function parseArray<T>(value: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function phoneOnly<T extends { id: string }>(phone: T[], cloud: T[]) {
  const cloudIds = new Set(cloud.map((record) => record.id));
  return phone.filter((record) => !cloudIds.has(record.id));
}

function mergeById<T extends { id: string }>(...groups: T[][]) {
  const records = new Map<string, T>();
  groups.flat().forEach((record) => records.set(record.id, record));
  return [...records.values()];
}

function sortSessions(records: SkopSessionRecord[]) {
  return [...records].sort(
    (first, second) =>
      new Date(second.startedAt).getTime() - new Date(first.startedAt).getTime()
  );
}

function sortCheckIns(records: SpendCheckIn[]) {
  return [...records].sort(
    (first, second) =>
      new Date(second.periodEnd).getTime() - new Date(first.periodEnd).getTime()
  );
}

function calculateMoneySaved(plan: QuitPlan | null, daysSmokeFree: number) {
  if (!plan || plan.status !== 'quit') return 0;
  return Math.floor(toDailySpend(plan) * daysSmokeFree);
}

function calculateExpectedBaselineCents(plan: QuitPlan, dayCount: number) {
  return Math.round(toDailySpend(plan) * dayCount * 100);
}

function toDailySpend(plan: Pick<QuitPlan, 'spendPeriod' | 'spendAmount'>) {
  return plan.spendPeriod === 'daily'
    ? plan.spendAmount
    : plan.spendPeriod === 'weekly'
      ? plan.spendAmount / 7
      : (plan.spendAmount * 12) / 365.25;
}

function getCompletedPeriod(cadence: CheckInCadence) {
  const today = startOfDay(new Date());
  let start: Date;
  let end: Date;

  if (cadence === 'daily') {
    start = addDays(today, -1);
    end = start;
  } else if (cadence === 'weekly') {
    const mondayOffset = (today.getDay() + 6) % 7;
    const thisMonday = addDays(today, -mondayOffset);
    start = addDays(thisMonday, -7);
    end = addDays(thisMonday, -1);
  } else {
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    end = new Date(today.getFullYear(), today.getMonth(), 0);
  }

  const startValue = dateToInputValue(start);
  const endValue = dateToInputValue(end);
  return {
    id: `spend-${cadence}-${startValue}-${endValue}`,
    start: startValue,
    end: endValue,
    dayCount: Math.round((end.getTime() - start.getTime()) / 86400000) + 1,
  };
}

function calculateStreak(quitDate?: string | null) {
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
  const first = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const day = Math.min(date.getDate(), daysInMonth(first.getFullYear(), first.getMonth()));
  return new Date(first.getFullYear(), first.getMonth(), day);
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

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function dateToInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
