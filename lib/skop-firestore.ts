import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/FirebaseConfig';

export type SpendPeriod = 'daily' | 'weekly' | 'monthly';
export type ProductType = 'cigarettes' | 'vaping' | 'both';
export type QuitJourney = 'already_quit' | 'cut_down' | 'ready_to_quit';
export type QuitStatus = 'quit' | 'reducing' | 'scheduled';
export type CheckInCadence = 'daily' | 'weekly' | 'monthly';
export type ReminderTime = 'morning' | 'evening';

export type QuitPlan = {
  profileVersion: 2;
  productType: ProductType;
  journey: QuitJourney;
  status: QuitStatus;
  quitDate: string | null;
  targetQuitDate: string | null;
  spendPeriod: SpendPeriod;
  spendAmount: number;
  checkInCadence: CheckInCadence | null;
  remindersEnabled: boolean;
  reminderTime: ReminderTime | null;
  ageConfirmedAt: string;
};

export type LegacyQuitPlan = {
  profileVersion: 1;
  quitDate: string;
  spendPeriod: SpendPeriod;
  spendAmount: number;
};

export type LoadedProfile = QuitPlan | LegacyQuitPlan;

export type SpendCheckIn = {
  id: string;
  periodStart: string;
  periodEnd: string;
  amountCents: number;
  expectedBaselineCents: number;
  cadence: CheckInCadence;
  createdAt: string;
};

export type SkopSessionRecord = {
  id: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  score: number;
  highestLevel: number;
};

type FirestoreProfile = {
  schemaVersion?: number;
  profileVersion?: number;
  productType?: ProductType;
  journey?: QuitJourney;
  status?: QuitStatus;
  quitDate?: string | null;
  targetQuitDate?: string | null;
  spendPeriod?: SpendPeriod;
  spendAmountCents?: number;
  checkInCadence?: CheckInCadence | null;
  remindersEnabled?: boolean;
  reminderTime?: ReminderTime | null;
  ageConfirmedAt?: string;
};

type FirestoreSession = {
  startedAt: Timestamp;
  endedAt: Timestamp;
  durationSeconds: number;
  score: number;
  highestLevel: number;
};

type FirestoreCheckIn = {
  periodStart: string;
  periodEnd: string;
  amountCents: number;
  expectedBaselineCents: number;
  cadence: CheckInCadence;
  createdAt: Timestamp;
};

const spendPeriods = ['daily', 'weekly', 'monthly'] as const;
const productTypes = ['cigarettes', 'vaping', 'both'] as const;
const journeys = ['already_quit', 'cut_down', 'ready_to_quit'] as const;
const statuses = ['quit', 'reducing', 'scheduled'] as const;
const cadences = ['daily', 'weekly', 'monthly'] as const;
const reminderTimes = ['morning', 'evening'] as const;

// firestore stores money as cents so decimal values do not drift
export async function saveFirestoreProfile(userId: string, plan: QuitPlan) {
  const userRef = doc(db, 'users', userId);
  const currentProfile = await getDoc(userRef);
  const profileFields = {
    profileVersion: 2,
    productType: plan.productType,
    journey: plan.journey,
    status: plan.status,
    quitDate: plan.quitDate,
    targetQuitDate: plan.targetQuitDate,
    spendPeriod: plan.spendPeriod,
    spendAmountCents: Math.round(plan.spendAmount * 100),
    checkInCadence: plan.checkInCadence,
    remindersEnabled: plan.remindersEnabled,
    reminderTime: plan.reminderTime,
    ageConfirmedAt: plan.ageConfirmedAt,
    schemaVersion: 2,
    updatedAt: serverTimestamp(),
  };

  if (currentProfile.exists()) {
    await updateDoc(userRef, profileFields);
    return;
  }

  await setDoc(userRef, {
    ...profileFields,
    createdAt: serverTimestamp(),
  });
}

export async function loadFirestoreProfile(userId: string): Promise<LoadedProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', userId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as FirestoreProfile;
  if (
    data.profileVersion === 2 &&
    includes(productTypes, data.productType) &&
    includes(journeys, data.journey) &&
    includes(statuses, data.status) &&
    (data.quitDate === null || isDateValue(data.quitDate)) &&
    (data.targetQuitDate === null || isDateValue(data.targetQuitDate)) &&
    includes(spendPeriods, data.spendPeriod) &&
    Number.isInteger(data.spendAmountCents) &&
    (data.checkInCadence === null || includes(cadences, data.checkInCadence)) &&
    typeof data.remindersEnabled === 'boolean' &&
    (data.reminderTime === null || includes(reminderTimes, data.reminderTime)) &&
    typeof data.ageConfirmedAt === 'string'
  ) {
    return {
      profileVersion: 2,
      productType: data.productType,
      journey: data.journey,
      status: data.status,
      quitDate: data.quitDate,
      targetQuitDate: data.targetQuitDate,
      spendPeriod: data.spendPeriod,
      spendAmount: data.spendAmountCents! / 100,
      checkInCadence: data.checkInCadence,
      remindersEnabled: data.remindersEnabled,
      reminderTime: data.reminderTime,
      ageConfirmedAt: data.ageConfirmedAt,
    };
  }

  if (
    isDateValue(data.quitDate) &&
    includes(spendPeriods, data.spendPeriod) &&
    Number.isInteger(data.spendAmountCents)
  ) {
    return {
      profileVersion: 1,
      quitDate: data.quitDate,
      spendPeriod: data.spendPeriod,
      spendAmount: data.spendAmountCents! / 100,
    };
  }

  return null;
}

// the check-in id describes one reporting period, so retries replace the same record
export async function saveFirestoreCheckIn(userId: string, checkIn: SpendCheckIn) {
  await setDoc(doc(db, 'users', userId, 'spendCheckIns', checkIn.id), {
    periodStart: checkIn.periodStart,
    periodEnd: checkIn.periodEnd,
    amountCents: checkIn.amountCents,
    expectedBaselineCents: checkIn.expectedBaselineCents,
    cadence: checkIn.cadence,
    createdAt: Timestamp.fromDate(new Date(checkIn.createdAt)),
    receivedAt: serverTimestamp(),
    schemaVersion: 1,
  });
}

export async function loadFirestoreCheckIns(userId: string): Promise<SpendCheckIn[]> {
  const checkInsQuery = query(
    collection(db, 'users', userId, 'spendCheckIns'),
    orderBy('periodEnd', 'desc'),
    limit(500)
  );
  const snapshot = await getDocs(checkInsQuery);

  return snapshot.docs.flatMap((checkInDoc) => {
    const data = checkInDoc.data() as FirestoreCheckIn;
    if (
      !isDateValue(data.periodStart) ||
      !isDateValue(data.periodEnd) ||
      !Number.isInteger(data.amountCents) ||
      !Number.isInteger(data.expectedBaselineCents) ||
      !includes(cadences, data.cadence) ||
      !(data.createdAt instanceof Timestamp)
    ) {
      return [];
    }

    return [{
      id: checkInDoc.id,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      amountCents: data.amountCents,
      expectedBaselineCents: data.expectedBaselineCents,
      cadence: data.cadence,
      createdAt: data.createdAt.toDate().toISOString(),
    }];
  });
}

// the session id comes from the phone so retrying this write cannot make a duplicate
export async function saveFirestoreSession(userId: string, session: SkopSessionRecord) {
  await setDoc(doc(db, 'users', userId, 'sessions', session.id), {
    startedAt: Timestamp.fromDate(new Date(session.startedAt)),
    endedAt: Timestamp.fromDate(new Date(session.endedAt)),
    durationSeconds: session.durationSeconds,
    score: session.score,
    highestLevel: session.highestLevel,
    receivedAt: serverTimestamp(),
    schemaVersion: 1,
  });
}

export async function loadFirestoreSessions(userId: string): Promise<SkopSessionRecord[]> {
  const sessionsQuery = query(
    collection(db, 'users', userId, 'sessions'),
    orderBy('startedAt', 'desc'),
    limit(500)
  );
  const snapshot = await getDocs(sessionsQuery);

  return snapshot.docs.flatMap((sessionDoc) => {
    const data = sessionDoc.data() as FirestoreSession;
    if (
      !(data.startedAt instanceof Timestamp) ||
      !(data.endedAt instanceof Timestamp) ||
      !Number.isInteger(data.durationSeconds) ||
      !Number.isInteger(data.score) ||
      !Number.isInteger(data.highestLevel)
    ) {
      return [];
    }

    return [{
      id: sessionDoc.id,
      startedAt: data.startedAt.toDate().toISOString(),
      endedAt: data.endedAt.toDate().toISOString(),
      durationSeconds: data.durationSeconds,
      score: data.score,
      highestLevel: data.highestLevel,
    }];
  });
}

// account deletion clears child documents before removing the user profile
export async function deleteFirestoreUserData(userId: string) {
  await deleteCollection(userId, 'sessions');
  await deleteCollection(userId, 'spendCheckIns');
  await deleteDoc(doc(db, 'users', userId));
}

async function deleteCollection(userId: string, collectionName: string) {
  const collectionRef = collection(db, 'users', userId, collectionName);

  while (true) {
    const snapshot = await getDocs(query(collectionRef, limit(400)));
    if (snapshot.empty) break;

    const batch = writeBatch(db);
    snapshot.docs.forEach((childDoc) => batch.delete(childDoc.ref));
    await batch.commit();
  }
}

function includes<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function isDateValue(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
