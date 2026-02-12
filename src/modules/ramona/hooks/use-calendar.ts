'use client';

import { useState, useMemo, useCallback } from 'react';
import type { RMContent } from '../types';

export function useCalendar(contents: RMContent[]) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const nextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay(); // 0 = Sunday

    const days: { date: Date; isCurrentMonth: boolean; contents: RMContent[] }[] = [];

    // Previous month padding
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false, contents: [] });
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      const dayContents = contents.filter((c) => {
        if (!c.scheduled_at) return false;
        return c.scheduled_at.startsWith(dayStr);
      });

      days.push({ date, isCurrentMonth: true, contents: dayContents });
    }

    // Next month padding (fill to 42 cells = 6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, contents: [] });
    }

    return days;
  }, [year, month, contents]);

  const monthLabel = currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });

  return {
    currentDate,
    year,
    month,
    monthLabel,
    calendarDays,
    prevMonth,
    nextMonth,
    goToToday,
  };
}
