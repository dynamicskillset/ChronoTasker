import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types';
import { todayString, yesterdayString } from '../utils/scheduling';
import { fetchTasks as apiFetchTasks } from '../services/api';
import { getLocalTasks } from '../services/storage';
import { getLastUnfinishedReview, setLastUnfinishedReview } from '../services/storage';

interface UseUnfinishedTasksOptions {
  currentDate: string;
  enabled: boolean;
}

interface UseUnfinishedTasksResult {
  unfinishedTasks: Task[];
  setUnfinishedTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  showPrompt: boolean;
  dismissPrompt: () => void;
}

export function useUnfinishedTasks({
  currentDate,
  enabled,
}: UseUnfinishedTasksOptions): UseUnfinishedTasksResult {
  const [unfinishedTasks, setUnfinishedTasks] = useState<Task[]>([]);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (currentDate !== todayString()) return;

    const yesterday = yesterdayString();
    if (getLastUnfinishedReview() === yesterday) return;

    let cancelled = false;

    const fetchYesterdayTasks = async () => {
      let tasks: Task[];
      try {
        tasks = await apiFetchTasks(yesterday);
      } catch {
        // Offline fallback
        tasks = getLocalTasks(yesterday);
      }

      if (cancelled) return;

      const unfinished = tasks.filter(
        (t) => !t.completed && !t.isBreak && !t.recurrencePattern
      );

      if (unfinished.length > 0) {
        setUnfinishedTasks(unfinished);
        setShowPrompt(true);
      }
    };

    fetchYesterdayTasks();

    return () => {
      cancelled = true;
    };
  }, [currentDate, enabled]);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    setLastUnfinishedReview(yesterdayString());
  }, []);

  return { unfinishedTasks, setUnfinishedTasks, showPrompt, dismissPrompt };
}
