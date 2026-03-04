import { useState, useEffect, useRef, useCallback } from 'react';
import type { AppSettings, PomodoroState, PomodoroSession } from '../types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDurationSeconds(
  type: PomodoroState['type'],
  settings: AppSettings
): number {
  switch (type) {
    case 'work':
      return settings.workDuration * 60;
    case 'shortBreak':
      return settings.shortBreakDuration * 60;
    case 'longBreak':
      return settings.longBreakDuration * 60;
  }
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContext();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

function playBeep(): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.08);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);

    // Play a second beep after a short gap
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.2);
    gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.21);
    gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.28);
    gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
    osc2.start(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.35);
  } catch {
    // Web Audio API not available; silently ignore
  }
}

function sendNotification(title: string, body: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.svg' });
  }
}

function requestNotificationPermission(): void {
  if (
    'Notification' in window &&
    Notification.permission === 'default'
  ) {
    Notification.requestPermission();
  }
}

export function usePomodoro(settings: AppSettings) {
  const [state, setState] = useState<PomodoroState>({
    isRunning: false,
    type: 'work',
    timeRemainingSeconds: getDurationSeconds('work', settings),
    completedPomodoros: 0,
    currentTaskId: null,
  });

  const [sessions, setSessions] = useState<PomodoroSession[]>(() => {
    // Load today's sessions from localStorage
    const today = todayDateString();
    try {
      const stored = localStorage.getItem(`pomodoro-sessions-${today}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<string | null>(null);

  // Persist sessions to localStorage when they change
  useEffect(() => {
    const today = todayDateString();
    localStorage.setItem(
      `pomodoro-sessions-${today}`,
      JSON.stringify(sessions)
    );
  }, [sessions]);

  // Sync duration if settings change while idle
  useEffect(() => {
    if (!state.isRunning) {
      setState((prev) => ({
        ...prev,
        timeRemainingSeconds: getDurationSeconds(prev.type, settings),
      }));
    }
  }, [
    settings.workDuration,
    settings.shortBreakDuration,
    settings.longBreakDuration,
    state.isRunning,
  ]);

  const completePhase = useCallback(() => {
    const now = new Date().toISOString();

    // Record the completed session
    const completedSession: PomodoroSession = {
      id: generateId(),
      taskId: state.currentTaskId,
      type: state.type,
      durationMinutes:
        state.type === 'work'
          ? settings.workDuration
          : state.type === 'shortBreak'
            ? settings.shortBreakDuration
            : settings.longBreakDuration,
      startedAt: sessionStartRef.current ?? now,
      completedAt: now,
      date: todayDateString(),
    };

    setSessions((prev) => [...prev, completedSession]);

    // Determine next phase
    let nextType: PomodoroState['type'];
    let nextCompletedPomodoros = state.completedPomodoros;

    if (state.type === 'work') {
      nextCompletedPomodoros = state.completedPomodoros + 1;
      if (
        nextCompletedPomodoros >= settings.pomodorosBeforeLongBreak
      ) {
        nextType = 'longBreak';
      } else {
        nextType = 'shortBreak';
      }
    } else {
      // After any break, go back to work
      if (state.type === 'longBreak') {
        nextCompletedPomodoros = 0;
      }
      nextType = 'work';
    }

    // Notifications and audio
    playBeep();
    if (state.type === 'work') {
      sendNotification(
        'ChronoTasker',
        nextType === 'longBreak'
          ? 'Great work! Time for a long break.'
          : 'Time for a break!'
      );
    } else {
      sendNotification('ChronoTasker', "Break's over! Time to focus.");
    }

    const nextDuration = getDurationSeconds(nextType, settings);
    sessionStartRef.current = new Date().toISOString();

    setState((prev) => ({
      ...prev,
      type: nextType,
      timeRemainingSeconds: nextDuration,
      completedPomodoros: nextCompletedPomodoros,
      isRunning: settings.autoAdvance,
    }));

    // If not auto-advancing, clear the interval
    if (!settings.autoAdvance && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [state.type, state.completedPomodoros, state.currentTaskId, settings]);

  // The countdown interval
  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.timeRemainingSeconds <= 1) {
            // Phase is complete; we handle the transition via completePhase
            // Clear the interval here; completePhase will restart if needed
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // Use setTimeout to avoid setState-in-setState issues
            setTimeout(() => completePhase(), 0);
            return { ...prev, timeRemainingSeconds: 0 };
          }
          return { ...prev, timeRemainingSeconds: prev.timeRemainingSeconds - 1 };
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isRunning, completePhase]);

  const start = useCallback(
    (taskId?: string, durationOverride?: number) => {
      requestNotificationPermission();
      sessionStartRef.current = new Date().toISOString();
      setState((prev) => {
        const defaultSeconds = getDurationSeconds(prev.type, settings);
        const seconds = durationOverride && prev.type === 'work'
          ? durationOverride * 60
          : defaultSeconds;
        return {
          ...prev,
          isRunning: true,
          currentTaskId: taskId ?? prev.currentTaskId,
          timeRemainingSeconds: seconds,
        };
      });
    },
    [settings]
  );

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const skip = useCallback(() => {
    // Treat as if the phase completed naturally
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    completePhase();
  }, [completePhase]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    sessionStartRef.current = null;
    setState({
      isRunning: false,
      type: 'work',
      timeRemainingSeconds: getDurationSeconds('work', settings),
      completedPomodoros: 0,
      currentTaskId: null,
    });
  }, [settings]);

  return {
    state,
    start,
    pause,
    resume,
    skip,
    reset,
    sessions,
  };
}
