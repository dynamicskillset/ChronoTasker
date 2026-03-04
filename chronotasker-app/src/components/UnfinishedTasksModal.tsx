import { useEffect, useRef, useCallback } from 'react';
import type { Task } from '../types';
import { formatDuration, tagColor, tagBgColor } from '../utils/format';
import './UnfinishedTasksModal.css';

interface UnfinishedTasksModalProps {
  open: boolean;
  tasks: Task[];
  hasBacklog: boolean;
  onMoveToToday: (taskId: string) => void;
  onMoveToBacklog: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onMoveAllToToday: () => void;
  onMoveAllToBacklog: () => void;
  onDeleteAll: () => void;
  onDismiss: () => void;
}

export default function UnfinishedTasksModal({
  open,
  tasks,
  hasBacklog,
  onMoveToToday,
  onMoveToBacklog,
  onDelete,
  onMoveAllToToday,
  onMoveAllToBacklog,
  onDeleteAll,
  onDismiss,
}: UnfinishedTasksModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onDismiss();
      return;
    }

    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onDismiss]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      const closeBtn = modalRef.current?.querySelector<HTMLElement>('.unfinished-modal__close');
      closeBtn?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open || tasks.length === 0) return null;

  return (
    <div className="unfinished-modal-overlay" onClick={onDismiss}>
      <div
        ref={modalRef}
        className="unfinished-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unfinished-modal-title"
      >
        <div className="unfinished-modal__header">
          <h2 id="unfinished-modal-title" className="unfinished-modal__title">Yesterday's unfinished tasks</h2>
          <button
            className="unfinished-modal__close"
            onClick={onDismiss}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="unfinished-modal__body">
          <ul className="unfinished-modal__list">
            {tasks.map((task) => (
              <li key={task.id} className="unfinished-modal__item">
                <div className="unfinished-modal__item-info">
                  <span className="unfinished-modal__item-title">
                    {task.title}
                    {task.tag && (
                      <span
                        className="unfinished-modal__tag"
                        style={{ color: tagColor(task.tag), backgroundColor: tagBgColor(task.tag) }}
                      >
                        {task.tag}
                      </span>
                    )}
                  </span>
                  <span className="unfinished-modal__item-duration">
                    {formatDuration(task.durationMinutes)}
                  </span>
                </div>
                <div className="unfinished-modal__item-actions">
                  <button
                    className="unfinished-modal__action-btn unfinished-modal__action-btn--accent"
                    onClick={() => onMoveToToday(task.id)}
                    aria-label={`Move "${task.title}" to today`}
                  >
                    Today
                  </button>
                  {hasBacklog && (
                    <button
                      className="unfinished-modal__action-btn unfinished-modal__action-btn--secondary"
                      onClick={() => onMoveToBacklog(task.id)}
                      aria-label={`Move "${task.title}" to backlog`}
                    >
                      Backlog
                    </button>
                  )}
                  <button
                    className="unfinished-modal__action-btn unfinished-modal__action-btn--danger"
                    onClick={() => onDelete(task.id)}
                    aria-label={`Delete "${task.title}"`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="unfinished-modal__footer">
          <button
            className="unfinished-modal__bulk-btn unfinished-modal__bulk-btn--accent"
            onClick={onMoveAllToToday}
          >
            Move all to today
          </button>
          {hasBacklog && (
            <button
              className="unfinished-modal__bulk-btn unfinished-modal__bulk-btn--secondary"
              onClick={onMoveAllToBacklog}
            >
              Move all to backlog
            </button>
          )}
          <button
            className="unfinished-modal__bulk-btn unfinished-modal__bulk-btn--danger"
            onClick={onDeleteAll}
          >
            Delete all
          </button>
        </div>
      </div>
    </div>
  );
}
