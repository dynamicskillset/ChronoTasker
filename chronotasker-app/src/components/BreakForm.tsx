import { useState } from 'react';
import type { Task } from '../types';
import './BreakForm.css';

interface BreakFormProps {
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>) => void;
  date: string;
}

const BREAK_PRESETS = [5, 10, 15, 30] as const;

export default function BreakForm({ onSubmit, date }: BreakFormProps) {
  const [duration, setDuration] = useState(15);
  const [time, setTime] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    onSubmit({
      title: time ? `Break @ ${time}` : 'Break',
      durationMinutes: duration,
      fixedStartTime: time || undefined,
      completed: false,
      important: false,
      isBreak: true,
      date,
    });

    setTime('');
  }

  return (
    <form className="break-form" onSubmit={handleSubmit}>
      <span className="break-form__label">Break</span>
      <div className="break-form__presets">
        {BREAK_PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            className={`break-form__pill ${duration === m ? 'break-form__pill--active' : ''}`}
            onClick={() => setDuration(m)}
            aria-pressed={duration === m}
          >
            {m}m
          </button>
        ))}
      </div>
      <input
        type="time"
        className="break-form__time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        aria-label="Break time (optional)"
        title="Set a time (optional)"
      />
      <button type="submit" className="break-form__add">+ Break</button>
    </form>
  );
}
