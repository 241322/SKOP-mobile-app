import type { CheckInCadence, QuitJourney, QuitPlan } from '@/lib/skop-firestore';

export type AgeGroup = 'under_13' | '13_17' | '18_plus';

export function getAgeGroup(birthDate: Date, now = new Date()): AgeGroup | null {
  if (Number.isNaN(birthDate.getTime()) || birthDate > startOfDay(now)) return null;

  let age = now.getFullYear() - birthDate.getFullYear();
  const birthdayThisYear = new Date(
    now.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate(),
  );
  if (birthdayThisYear > startOfDay(now)) age -= 1;

  if (age < 0 || age > 120) return null;
  if (age < 13) return 'under_13';
  if (age < 18) return '13_17';
  return '18_plus';
}

export function validateJourneyDate(journey: QuitJourney, date: Date, now = new Date()) {
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 1900) return 'Enter a valid date.';
  const today = startOfDay(now);
  const selected = startOfDay(date);
  if (journey === 'already_quit' && selected > today) return 'Choose today or a date in the past.';
  if (journey === 'cut_down' && selected <= today) return 'Choose a target date after today.';
  if (journey === 'ready_to_quit' && selected < today) return 'Choose today or a date ahead.';
  return '';
}

export function calculateStreak(quitDate?: string | null, now = new Date()) {
  if (!quitDate) {
    return { streak: { years: 0, months: 0, days: 0 }, totalDays: 0 };
  }

  const start = inputValueToDate(quitDate);
  const today = startOfDay(now);
  if (Number.isNaN(start.getTime()) || start > today) {
    return { streak: { years: 0, months: 0, days: 0 }, totalDays: 0 };
  }

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

export function calculateMoneySaved(plan: QuitPlan | null, daysQuit: number) {
  if (!plan || plan.status !== 'quit') return 0;
  return Math.floor(toDailySpend(plan) * daysQuit);
}

export function calculateExpectedBaselineCents(plan: QuitPlan, dayCount: number) {
  return Math.round(toDailySpend(plan) * dayCount * 100);
}

export function toDailySpend(plan: Pick<QuitPlan, 'spendPeriod' | 'spendAmount'>) {
  return plan.spendPeriod === 'daily'
    ? plan.spendAmount
    : plan.spendPeriod === 'weekly'
      ? plan.spendAmount / 7
      : (plan.spendAmount * 12) / 365.25;
}

export function getCompletedPeriod(cadence: CheckInCadence, now = new Date()) {
  const today = startOfDay(now);
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

export function inputValueToDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return new Date(Number.NaN);
  }
  return date;
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function dateToInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
