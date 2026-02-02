import type { Activity } from '../types/activity';

export interface DayData {
  day: string;
  dayLabel: string;
  date: Date;
  miles: number;
  time: number;
}

export interface WeekSummary {
  totalRuns: number;
  totalMiles: number;
  totalCalories: number;
  totalTime: number;
  heartRateSum: number;
  heartRateCount: number;
  paceActivities: number;
}

export interface WeekSummaryItem {
  weekStart: Date;
  weekNumber: number;
  summary: WeekSummary;
}

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDataForStart(
  activities: Activity[],
  weekStart: Date
): { days: DayData[]; summary: WeekSummary } {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const days: DayData[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    days.push({
      day: WEEKDAY_NAMES[i],
      dayLabel: `${WEEKDAY_NAMES[i]} ${date.getDate()}`,
      date: new Date(date),
      miles: 0,
      time: 0,
    });
  }

  const summary: WeekSummary = {
    totalRuns: 0,
    totalMiles: 0,
    totalCalories: 0,
    totalTime: 0,
    heartRateSum: 0,
    heartRateCount: 0,
    paceActivities: 0,
  };

  activities.forEach((activity) => {
    if (!activity.startDateLocal) return;

    const activityDate = new Date(activity.startDateLocal);
    activityDate.setHours(0, 0, 0, 0);

    if (activityDate >= weekStart && activityDate <= weekEnd) {
      const dayIndex = Math.floor((activityDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        summary.totalRuns += 1;
        if (activity.distance) {
          days[dayIndex].miles += activity.distance;
          summary.totalMiles += activity.distance;
        }
        if (activity.elapsedTime) {
          days[dayIndex].time += activity.elapsedTime;
          summary.totalTime += activity.elapsedTime;
        }
        if (activity.calories) summary.totalCalories += activity.calories;
        if (activity.averageHeartRate && activity.averageHeartRate > 0) {
          summary.heartRateSum += activity.averageHeartRate;
          summary.heartRateCount += 1;
        }
        if (activity.distance && activity.distance > 0 && activity.elapsedTime && activity.elapsedTime > 0) {
          summary.paceActivities += 1;
        }
      }
    }
  });

  return { days, summary };
}
