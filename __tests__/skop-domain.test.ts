import {
  calculateExpectedBaselineCents,
  calculateMoneySaved,
  calculateStreak,
  getCompletedPeriod,
  getAgeGroup,
  inputValueToDate,
  toDailySpend,
  validateJourneyDate,
} from '@/lib/skop-domain';
import type { QuitPlan } from '@/lib/skop-firestore';

const today = new Date(2026, 7, 17, 12);

function makePlan(overrides: Partial<QuitPlan> = {}): QuitPlan {
  return {
    profileVersion: 2,
    productType: 'cigarettes',
    journey: 'already_quit',
    status: 'quit',
    quitDate: '2026-08-01',
    targetQuitDate: null,
    spendPeriod: 'daily',
    spendAmount: 60,
    checkInCadence: null,
    remindersEnabled: false,
    reminderTime: null,
    ageConfirmedAt: '2026-08-01T08:00:00.000Z',
    ageGroup: '18_plus',
    guardianConsentAt: null,
    guardianConsentVersion: null,
    guardianPinHash: null,
    guardianPinSalt: null,
    guardianRelationship: null,
    ...overrides,
  };
}

describe('journey dates', () => {
  test.each([
    ['already_quit', '2026-08-17', ''],
    ['already_quit', '2026-08-18', 'Choose today or a date in the past.'],
    ['cut_down', '2026-08-18', ''],
    ['cut_down', '2026-08-17', 'Choose a target date after today.'],
    ['ready_to_quit', '2026-08-17', ''],
    ['ready_to_quit', '2026-08-16', 'Choose today or a date ahead.'],
  ] as const)('%s validates %s', (journey, value, expected) => {
    expect(validateJourneyDate(journey, inputValueToDate(value), today)).toBe(expected);
  });

  test('rejects dates that do not exist', () => {
    expect(validateJourneyDate('already_quit', inputValueToDate('2026-02-30'), today)).toBe(
      'Enter a valid date.',
    );
  });
});

describe('age groups', () => {
  test.each([
    ['2013-08-18', 'under_13'],
    ['2013-08-17', '13_17'],
    ['2008-08-18', '13_17'],
    ['2008-08-17', '18_plus'],
  ] as const)('places %s in the expected band', (value, expected) => {
    expect(getAgeGroup(inputValueToDate(value), today)).toBe(expected);
  });

  test('rejects future and implausible birth dates', () => {
    expect(getAgeGroup(inputValueToDate('2026-08-18'), today)).toBeNull();
    expect(getAgeGroup(inputValueToDate('1900-01-01'), today)).toBeNull();
  });
});

describe('spending calculations', () => {
  test.each([
    ['daily', 60, 60],
    ['weekly', 700, 100],
    ['monthly', 365.25, 12],
  ] as const)('converts a %s baseline to a daily amount', (spendPeriod, spendAmount, expected) => {
    expect(toDailySpend(makePlan({ spendPeriod, spendAmount }))).toBeCloseTo(expected);
  });

  test('stores the expected baseline for the check-in period', () => {
    expect(calculateExpectedBaselineCents(makePlan({ spendPeriod: 'weekly', spendAmount: 700 }), 7)).toBe(
      70000,
    );
  });

  test('only estimates savings after a confirmed quit', () => {
    expect(calculateMoneySaved(makePlan(), 10)).toBe(600);
    expect(calculateMoneySaved(makePlan({ status: 'reducing' }), 10)).toBe(0);
  });
});

describe('completed check-in periods', () => {
  test('uses yesterday for a daily check-in', () => {
    expect(getCompletedPeriod('daily', today)).toMatchObject({
      start: '2026-08-16',
      end: '2026-08-16',
      dayCount: 1,
    });
  });

  test('uses the last Monday to Sunday for a weekly check-in', () => {
    expect(getCompletedPeriod('weekly', today)).toMatchObject({
      start: '2026-08-10',
      end: '2026-08-16',
      dayCount: 7,
    });
  });

  test('handles the length of the previous month', () => {
    expect(getCompletedPeriod('monthly', new Date(2024, 2, 1))).toMatchObject({
      start: '2024-02-01',
      end: '2024-02-29',
      dayCount: 29,
    });
  });
});

describe('streak calculations', () => {
  test('breaks a streak into years, months and days', () => {
    expect(calculateStreak('2025-07-31', today)).toEqual({
      streak: { years: 1, months: 0, days: 17 },
      totalDays: 382,
    });
  });

  test('clamps leap-day anniversaries', () => {
    expect(calculateStreak('2024-02-29', new Date(2025, 1, 28))).toEqual({
      streak: { years: 1, months: 0, days: 0 },
      totalDays: 365,
    });
  });

  test('returns zero for a future or invalid quit date', () => {
    expect(calculateStreak('2026-08-18', today).totalDays).toBe(0);
    expect(calculateStreak('not-a-date', today).totalDays).toBe(0);
  });
});
