'use client';

import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { RMContent } from '../types';
import { useCalendar } from '../hooks/use-calendar';
import { CalendarDay } from './calendar-day';

interface CalendarViewProps {
  contents: RMContent[];
  onEdit: (content: RMContent) => void;
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function CalendarView({ contents, onEdit }: CalendarViewProps) {
  const t = useTranslations('ramona.calendar');
  const { monthLabel, calendarDays, prevMonth, nextMonth, goToToday } = useCalendar(contents);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-xs rounded-lg border border-border hover:bg-muted transition-colors"
          >
            {t('today')}
          </button>
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label={t('month.previous')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[150px] text-center capitalize">{monthLabel}</span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label={t('month.next')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2 border-b border-border">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, i) => {
          const dayStr = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;
          return (
            <CalendarDay
              key={i}
              date={day.date}
              isCurrentMonth={day.isCurrentMonth}
              isToday={dayStr === todayStr}
              contents={day.contents}
              onContentClick={onEdit}
            />
          );
        })}
      </div>
    </div>
  );
}
