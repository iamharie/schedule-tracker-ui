import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addMonths, subMonths, addYears, subYears } from 'date-fns';

export type Theme = 'light' | 'dark' | 'system';

export type CalendarSummary = {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
};

type CalendarContextValue = {
  activeDate: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  prevYear: () => void;
  nextYear: () => void;
  goToToday: () => void;
  goToDate: (d: Date) => void;

  calendars: CalendarSummary[];
  setCalendars: (cals: CalendarSummary[]) => void;
  selectedIds: Set<string>;
  toggleCalendar: (id: string) => void;

  theme: Theme;
  setTheme: (t: Theme) => void;
};

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [activeDate, setActiveDate] = useState(() => new Date());
  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('st-theme') as Theme) ?? 'system',
  );

  // Keep selectedIds in sync when calendars are loaded
  useEffect(() => {
    if (calendars.length > 0 && selectedIds.size === 0) {
      setSelectedIds(new Set(calendars.map((c) => c.id)));
    }
  }, [calendars, selectedIds.size]);

  // Apply theme to <html> and persist. Always set data-theme explicitly (never
  // remove it) — tokens.css's system-dark media query opts out only on the
  // literal `data-theme="light"` value, so leaving the attribute absent for
  // an explicit Light choice let the OS dark preference override it anyway.
  useEffect(() => {
    const html = document.documentElement;
    const dark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    html.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('st-theme', theme);
  }, [theme]);

  const prevMonth = useCallback(() => setActiveDate((d) => subMonths(d, 1)), []);
  const nextMonth = useCallback(() => setActiveDate((d) => addMonths(d, 1)), []);
  const prevYear = useCallback(() => setActiveDate((d) => subYears(d, 1)), []);
  const nextYear = useCallback(() => setActiveDate((d) => addYears(d, 1)), []);
  const goToToday = useCallback(() => setActiveDate(new Date()), []);
  const goToDate = useCallback((d: Date) => setActiveDate(d), []);

  const toggleCalendar = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  const value = useMemo(
    () => ({
      activeDate,
      prevMonth,
      nextMonth,
      prevYear,
      nextYear,
      goToToday,
      goToDate,
      calendars,
      setCalendars,
      selectedIds,
      toggleCalendar,
      theme,
      setTheme,
    }),
    [
      activeDate,
      prevMonth,
      nextMonth,
      prevYear,
      nextYear,
      goToToday,
      goToDate,
      calendars,
      selectedIds,
      toggleCalendar,
      theme,
      setTheme,
    ],
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendarContext() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendarContext must be inside CalendarProvider');
  return ctx;
}
