import type { Task, PomodoroSession, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const STORAGE_KEYS = {
  tasks: 'chronotasker_tasks',
  sessions: 'chronotasker_sessions',
  settings: 'chronotasker_settings',
  lastSync: 'chronotasker_last_sync',
  lastUnfinishedReview: 'chronotasker_last_unfinished_review',
} as const;

// Tasks
export function getLocalTasks(date: string): Task[] {
  const all = getAllLocalTasks();
  return all.filter(t => t.date === date).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getAllLocalTasks(): Task[] {
  const raw = localStorage.getItem(STORAGE_KEYS.tasks);
  return raw ? JSON.parse(raw) : [];
}

export function saveLocalTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
}

export function upsertLocalTask(task: Task): void {
  const tasks = getAllLocalTasks();
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx >= 0) {
    tasks[idx] = task;
  } else {
    tasks.push(task);
  }
  saveLocalTasks(tasks);
}

export function removeLocalTask(id: string): void {
  const tasks = getAllLocalTasks().filter(t => t.id !== id);
  saveLocalTasks(tasks);
}

export function removeLocalTasksByRecurrenceSource(sourceId: string): string[] {
  const all = getAllLocalTasks();
  const removedIds: string[] = [];
  const kept: Task[] = [];
  for (const t of all) {
    if (t.id === sourceId || t.recurrenceSourceId === sourceId) {
      removedIds.push(t.id);
    } else {
      kept.push(t);
    }
  }
  saveLocalTasks(kept);
  return removedIds;
}

export function removeLocalTasksFutureByRecurrenceSource(sourceId: string, fromDate: string): string[] {
  const all = getAllLocalTasks();
  const removedIds: string[] = [];
  const kept: Task[] = [];
  for (const t of all) {
    const isTemplate = t.id === sourceId && t.date >= fromDate;
    const isFutureInstance = t.recurrenceSourceId === sourceId && t.date >= fromDate;
    if (isTemplate || isFutureInstance) {
      removedIds.push(t.id);
    } else {
      kept.push(t);
    }
  }
  saveLocalTasks(kept);
  return removedIds;
}

// Sessions
export function getLocalSessions(date: string): PomodoroSession[] {
  const all = getAllLocalSessions();
  return all.filter(s => s.date === date);
}

export function getAllLocalSessions(): PomodoroSession[] {
  const raw = localStorage.getItem(STORAGE_KEYS.sessions);
  return raw ? JSON.parse(raw) : [];
}

export function saveLocalSessions(sessions: PomodoroSession[]): void {
  localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
}

export function upsertLocalSession(session: PomodoroSession): void {
  const sessions = getAllLocalSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  saveLocalSessions(sessions);
}

// Settings
export function getLocalSettings(): AppSettings {
  const raw = localStorage.getItem(STORAGE_KEYS.settings);
  if (!raw) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export function saveLocalSettings(settings: Partial<AppSettings>): void {
  const current = getLocalSettings();
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({ ...current, ...settings }));
}

// Unfinished tasks review tracking
export function getLastUnfinishedReview(): string {
  return localStorage.getItem(STORAGE_KEYS.lastUnfinishedReview) || '';
}

export function setLastUnfinishedReview(date: string): void {
  localStorage.setItem(STORAGE_KEYS.lastUnfinishedReview, date);
}

// Sync timestamp
export function getLastSync(): string {
  return localStorage.getItem(STORAGE_KEYS.lastSync) || new Date(0).toISOString();
}

export function setLastSync(timestamp: string): void {
  localStorage.setItem(STORAGE_KEYS.lastSync, timestamp);
}
