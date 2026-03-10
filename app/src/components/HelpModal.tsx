import { useState, useEffect, useRef, useCallback, useId } from 'react';
import './HelpModal.css';

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const answerId = useId();

  return (
    <div className={`help-faq__item ${open ? 'help-faq__item--open' : ''}`}>
      <button
        className="help-faq__question"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={answerId}
      >
        <span>{question}</span>
        <svg
          className="help-faq__chevron"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 5.5L7 8.5L10 5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div id={answerId} className="help-faq__answer" hidden={!open}>
        {children}
      </div>
    </div>
  );
}

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  demoMode?: boolean;
  onToggleDemoMode?: () => void;
}

export default function HelpModal({ open, onClose, demoMode, onToggleDemoMode }: HelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap and keyboard handling
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
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
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    // Save the element that had focus before opening
    previousFocusRef.current = document.activeElement as HTMLElement;

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Move focus into the modal
    requestAnimationFrame(() => {
      const closeBtn = modalRef.current?.querySelector<HTMLElement>('.help-modal__close');
      closeBtn?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      // Return focus to the trigger element
      previousFocusRef.current?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="help-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="help-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
      >
        <div className="help-modal__header">
          <h2 id="help-modal-title" className="help-modal__title">How to use TaskDial</h2>
          <button
            className="help-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="help-modal__body">
          {onToggleDemoMode && (
            <div className="help-modal__section help-modal__section--demo">
              <p>
                Load sample tasks, calendar events, and backlog items to explore all
                features without affecting your real data.
              </p>
              <button
                className={`help-modal__demo-btn ${demoMode ? 'help-modal__demo-btn--active' : ''}`}
                onClick={() => { onToggleDemoMode(); onClose(); }}
              >
                {demoMode ? 'Exit demo mode' : 'Try demo mode'}
              </button>
            </div>
          )}

          <div className="help-modal__divider" />

          <p className="help-modal__intro">
            TaskDial shows your day as a clock. Each task is a coloured arc on the ring,
            so you can see at a glance whether your plan is realistic. A built-in Pomodoro
            timer helps you work in focused blocks.
          </p>

          <div className="help-modal__section">
            <h3>The clock face</h3>
            <p>
              The ring shows your day. Each coloured arc is a task; tap one to select it.
              The hand shows the current time. Connect a calendar feed and your meetings
              appear as arcs behind your tasks.
            </p>
          </div>

          <div className="help-modal__section">
            <h3>Adding and managing tasks</h3>
            <p>
              Add a task using the form on the right. Give it a name and duration, and
              optionally pin it to a fixed start time. Drag tasks up or down to reorder
              them, mark them complete, flag as important, or move to another day with
              the calendar icon.
            </p>
          </div>

          <div className="help-modal__section">
            <h3>The Pomodoro timer</h3>
            <p>
              Select a task and start the timer. Work for 25 minutes, take a short break,
              and repeat. Every four sessions a longer break kicks in. Enable it and adjust
              durations in Settings under <strong>Timer</strong>.{' '}
              <a
                href="https://francescocirillo.com/products/the-pomodoro-technique"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more about the technique.
              </a>
            </p>
          </div>

          <div className="help-modal__section">
            <h3>Settings</h3>
            <p>
              Click the <strong>gear icon</strong> in the top right. Use the tabs to find
              what you need. Turn on <strong>Advanced mode</strong> to unlock calendar
              feeds, recurring tasks, and the Pomodoro timer.
            </p>
          </div>

          <div className="help-modal__divider" />

          <div className="help-faq">
            <h3 className="help-faq__heading">Common questions</h3>

            <FaqItem question="Does it work offline?">
              <p>
                Yes. Tasks are saved locally first and synced to the server when you are
                back online. The status indicator in the header shows the current state.
              </p>
            </FaqItem>

            <FaqItem question="How do I connect my calendar?">
              <p>
                Open Settings and turn on Advanced mode. In the Calendars tab, paste an
                iCal URL from Google Calendar, Proton Calendar, or any other app that
                provides one, then press <strong>Load</strong>. Events appear on the clock
                and the feed refreshes every five minutes.
              </p>
            </FaqItem>

            <FaqItem question="What does 'auto-advance' do?">
              <p>
                When on, tasks are scheduled from the current time rather than the start
                of your day, so your plan always looks forward. Turn it off in Settings
                if you want tasks to start from your day's set start time instead.
              </p>
            </FaqItem>

            <FaqItem question="Can I move a task to a different day?">
              <p>
                Yes. Tap a task and click the calendar icon to move it. Send it to
                tomorrow with one click, or pick any date. Use the arrows in the date bar
                to browse days, or click <strong>Today</strong> to come back.
              </p>
            </FaqItem>

            <FaqItem question="What does the meeting buffer do?">
              <p>
                With a calendar connected, TaskDial leaves a gap after each meeting before
                placing your next task. Set the gap length in Settings under Calendars,
                or set it to 0 to turn it off.
              </p>
            </FaqItem>

            <FaqItem question="Does TaskDial read my calendar data?">
              <p>
                No. Your calendar feed is fetched by your browser directly. TaskDial never
                sends calendar data to the server; events are held in memory while the app
                is open and discarded when you close it.
              </p>
            </FaqItem>

            <FaqItem question="What data does TaskDial store about me?">
              <p>
                Your email, a hashed password, your settings, and Pomodoro session records.
                Task titles, tags, and notes are encrypted on your device before they reach
                the server. The encryption key comes from your password and never leaves
                your browser, so the server cannot read your task content. We keep a
                security log (sign-in events, admin actions) that is deleted after 12
                months. We do not use trackers, share data with third parties, or use your
                data to train AI models. See the{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>{' '}
                for full details.
              </p>
            </FaqItem>

            <FaqItem question="What's the backlog?">
              <p>
                The backlog holds tasks that are not tied to a specific day. Add something
                there when you want to do it eventually but have not decided when. Move
                backlog items to any day using the calendar icon, or drag them into the
                task list.
              </p>
            </FaqItem>
          </div>
        </div>
      </div>
    </div>
  );
}
