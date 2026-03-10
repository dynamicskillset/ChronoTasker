import { useEffect, useRef, useCallback } from 'react';
import './RecurringDeleteModal.css';

interface RecurringDeleteModalProps {
  open: boolean;
  taskTitle: string;
  onJustThisOne: () => void;
  onAllInSeries: () => void;
  onThisAndFuture: () => void;
  onCancel: () => void;
}

export default function RecurringDeleteModal({
  open,
  taskTitle,
  onJustThisOne,
  onAllInSeries,
  onThisAndFuture,
  onCancel,
}: RecurringDeleteModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
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
  }, [onCancel]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      const closeBtn = modalRef.current?.querySelector<HTMLElement>('.recurring-delete-modal__close');
      closeBtn?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="recurring-delete-overlay" onClick={onCancel}>
      <div
        ref={modalRef}
        className="recurring-delete-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recurring-delete-modal-title"
      >
        <div className="recurring-delete-modal__header">
          <h2 id="recurring-delete-modal-title" className="recurring-delete-modal__title">Delete recurring task</h2>
          <button
            className="recurring-delete-modal__close"
            onClick={onCancel}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="recurring-delete-modal__body">
          <p className="recurring-delete-modal__prompt">
            Delete &ldquo;{taskTitle}&rdquo;?
          </p>

          <div className="recurring-delete-modal__options">
            <button
              className="recurring-delete-modal__option recurring-delete-modal__option--accent"
              onClick={onJustThisOne}
            >
              <span className="recurring-delete-modal__option-title">Just this one</span>
              <span className="recurring-delete-modal__option-subtitle">Remove only this day's task</span>
            </button>

            <button
              className="recurring-delete-modal__option recurring-delete-modal__option--danger"
              onClick={onAllInSeries}
            >
              <span className="recurring-delete-modal__option-title">All in series</span>
              <span className="recurring-delete-modal__option-subtitle">Remove the template and every instance</span>
            </button>

            <button
              className="recurring-delete-modal__option recurring-delete-modal__option--warning"
              onClick={onThisAndFuture}
            >
              <span className="recurring-delete-modal__option-title">This and future</span>
              <span className="recurring-delete-modal__option-subtitle">Remove from today onwards</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
