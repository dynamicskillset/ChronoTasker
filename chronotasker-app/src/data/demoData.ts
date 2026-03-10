import type { Task, CalendarEvent, AppSettings } from '../types';

export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function offsetDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayOffset(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

// ── Yesterday ────────────────────────────────────────────────

function getYesterdayTasks(date: string, now: string): Task[] {
  return [
    {
      id: 'demo-y-1',
      title: 'Inbox zero',
      durationMinutes: 20,
      completed: true,
      important: false,
      isBreak: false,
      tag: 'admin',
      sortOrder: 0,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-y-2',
      title: 'Deep work: feature spec',
      durationMinutes: 90,
      fixedStartTime: '09:00',
      completed: true,
      important: true,
      isBreak: false,
      tag: 'deep work',
      details: '- Define API contract\n- Sketch data model\n- Review existing patterns',
      sortOrder: 1,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-y-3',
      title: 'Lunch break',
      durationMinutes: 45,
      completed: true,
      important: false,
      isBreak: true,
      sortOrder: 2,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-y-4',
      title: 'Sprint retrospective',
      durationMinutes: 60,
      fixedStartTime: '14:00',
      completed: true,
      important: false,
      isBreak: false,
      tag: 'team',
      sortOrder: 3,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-y-5',
      title: 'Write up retro notes',
      durationMinutes: 20,
      completed: true,
      important: false,
      isBreak: false,
      tag: 'admin',
      sortOrder: 4,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-y-6',
      title: 'Plan for today',
      durationMinutes: 15,
      completed: true,
      important: false,
      isBreak: false,
      sortOrder: 5,
      date,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function getYesterdayEvents(): CalendarEvent[] {
  return [
    {
      uid: 'demo-cal-y-1',
      summary: 'Sprint retrospective',
      startMinutes: 14 * 60,
      endMinutes: 15 * 60,
      allDay: false,
    },
  ];
}

// ── Today ────────────────────────────────────────────────────

function getTodayTasks(date: string, now: string): Task[] {
  return [
    {
      id: 'demo-1',
      title: 'Morning review',
      durationMinutes: 15,
      completed: true,
      important: false,
      isBreak: false,
      tag: 'admin',
      sortOrder: 0,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-2',
      title: 'Write project proposal',
      durationMinutes: 50,
      fixedStartTime: '09:30',
      completed: false,
      important: true,
      isBreak: false,
      tag: 'deep work',
      details: '- Outline key objectives\n- Draft budget section\n- Review [brief](https://example.com)',
      sortOrder: 1,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-3',
      title: 'Team standup',
      durationMinutes: 15,
      fixedStartTime: '10:30',
      completed: false,
      important: false,
      isBreak: false,
      sortOrder: 2,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-4',
      title: 'Design new landing page',
      durationMinutes: 25,
      completed: false,
      important: false,
      isBreak: false,
      tag: 'design',
      recurrencePattern: 'weekdays',
      sortOrder: 3,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-5',
      title: 'Email follow-ups',
      durationMinutes: 15,
      completed: false,
      important: false,
      isBreak: false,
      tag: 'admin',
      sortOrder: 4,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-6',
      title: 'Lunch break',
      durationMinutes: 45,
      completed: false,
      important: false,
      isBreak: true,
      sortOrder: 5,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-7',
      title: 'Code review',
      durationMinutes: 25,
      completed: false,
      important: false,
      isBreak: false,
      tag: 'dev',
      sortOrder: 6,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-8',
      title: 'Plan tomorrow',
      durationMinutes: 15,
      completed: false,
      important: false,
      isBreak: false,
      sortOrder: 7,
      date,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function getTodayEvents(): CalendarEvent[] {
  return [
    {
      uid: 'demo-cal-1',
      summary: 'Product sync',
      startMinutes: 11 * 60,
      endMinutes: 11 * 60 + 30,
      allDay: false,
    },
    {
      uid: 'demo-cal-2',
      summary: '1:1 with Alex',
      startMinutes: 14 * 60,
      endMinutes: 14 * 60 + 30,
      allDay: false,
    },
  ];
}

// ── Tomorrow ─────────────────────────────────────────────────

function getTomorrowTasks(date: string, now: string): Task[] {
  return [
    {
      id: 'demo-t-1',
      title: 'Morning review',
      durationMinutes: 15,
      completed: false,
      important: false,
      isBreak: false,
      tag: 'admin',
      sortOrder: 0,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-t-2',
      title: 'Implement auth flow',
      durationMinutes: 90,
      fixedStartTime: '09:00',
      completed: false,
      important: true,
      isBreak: false,
      tag: 'dev',
      details: '- OAuth integration\n- Session management\n- Error handling',
      sortOrder: 1,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-t-3',
      title: 'Coffee with Jamie',
      durationMinutes: 30,
      fixedStartTime: '11:00',
      completed: false,
      important: false,
      isBreak: false,
      tag: 'team',
      sortOrder: 2,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-t-4',
      title: 'Lunch break',
      durationMinutes: 45,
      completed: false,
      important: false,
      isBreak: true,
      sortOrder: 3,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-t-5',
      title: 'QA testing',
      durationMinutes: 30,
      completed: false,
      important: false,
      isBreak: false,
      tag: 'dev',
      sortOrder: 4,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-t-6',
      title: 'Prep for team demo',
      durationMinutes: 45,
      completed: false,
      important: false,
      isBreak: false,
      tag: 'design',
      sortOrder: 5,
      date,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-t-7',
      title: 'End of day wrap-up',
      durationMinutes: 20,
      completed: false,
      important: false,
      isBreak: false,
      tag: 'admin',
      sortOrder: 6,
      date,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function getTomorrowEvents(): CalendarEvent[] {
  return [
    {
      uid: 'demo-cal-t-1',
      summary: 'Coffee with Jamie',
      startMinutes: 11 * 60,
      endMinutes: 11 * 60 + 30,
      allDay: false,
    },
    {
      uid: 'demo-cal-t-2',
      summary: 'Team demo',
      startMinutes: 15 * 60,
      endMinutes: 16 * 60,
      allDay: false,
    },
  ];
}

// ── Public API ────────────────────────────────────────────────

export function getDemoTasks(dateStr?: string): Task[] {
  const date = dateStr ?? todayString();
  const now = new Date().toISOString();
  const offset = dayOffset(date);

  if (offset === -1) return getYesterdayTasks(date, now);
  if (offset === 0)  return getTodayTasks(date, now);
  if (offset === 1)  return getTomorrowTasks(date, now);
  return [];
}

export function getDemoCalendarEvents(dateStr?: string): CalendarEvent[] {
  const date = dateStr ?? todayString();
  const offset = dayOffset(date);

  if (offset === -1) return getYesterdayEvents();
  if (offset === 0)  return getTodayEvents();
  if (offset === 1)  return getTomorrowEvents();
  return [];
}

export function getDemoBacklogTasks(): Task[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'demo-backlog-1',
      title: 'Research analytics tools',
      durationMinutes: 45,
      completed: false,
      important: false,
      isBreak: false,
      tag: 'research',
      sortOrder: 0,
      date: 'backlog',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-backlog-2',
      title: 'Update documentation',
      durationMinutes: 30,
      completed: false,
      important: false,
      isBreak: false,
      tag: 'admin',
      sortOrder: 1,
      date: 'backlog',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-backlog-3',
      title: 'Accessibility audit',
      durationMinutes: 60,
      completed: false,
      important: false,
      isBreak: false,
      tag: 'design',
      sortOrder: 2,
      date: 'backlog',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function getDemoSettings(): AppSettings {
  return {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    pomodorosBeforeLongBreak: 4,
    dayStartHour: 8,
    dayEndHour: 18,
    use24Hour: true,
    autoAdvance: true,
    theme: 'system',
    colorScheme: 'yellow',
    meetingBufferMinutes: 15,
    enableRecurringTasks: true,
    enableBacklog: true,
    showPomodoroTimer: true,
    showDaySummary: false,
    clockPosition: 'left',
    advancedMode: true,
    enableSounds: false,
    icalUrls: [],
    workingDays: [1, 2, 3, 4, 5],
  };
}

// Exported so App.tsx can use the same today string
export { offsetDate };
