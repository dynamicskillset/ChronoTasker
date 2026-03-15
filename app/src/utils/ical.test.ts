import { describe, it, expect } from 'vitest';
import { parseIcalEvents } from './ical';

// ---------------------------------------------------------------------------
// Helpers — build minimal ICS text from parts
// ---------------------------------------------------------------------------

function makeIcs(...events: string[]): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

function makeEvent(fields: string[]): string {
  return ['BEGIN:VEVENT', ...fields, 'END:VEVENT'].join('\r\n');
}

// Local-time datetime string (no Z, no TZID) — result is timezone-agnostic
function dt(date: string, hhmm: string): string {
  const clean = date.replace(/-/g, '');
  return `${clean}T${hhmm.replace(':', '')}00`;
}

// ---------------------------------------------------------------------------

describe('parseIcalEvents — basic parsing', () => {
  it('returns empty array for an empty calendar', () => {
    expect(parseIcalEvents(makeIcs(), '2026-01-15')).toEqual([]);
  });

  it('returns empty array when no events match the target date', () => {
    const ics = makeIcs(makeEvent([
      'UID:abc',
      'SUMMARY:Meeting',
      `DTSTART:${dt('2026-01-10', '09:00')}`,
      `DTEND:${dt('2026-01-10', '10:00')}`,
    ]));
    expect(parseIcalEvents(ics, '2026-01-15')).toEqual([]);
  });

  it('parses a timed event on the target date', () => {
    const ics = makeIcs(makeEvent([
      'UID:test-1',
      'SUMMARY:Stand-up',
      `DTSTART:${dt('2026-01-15', '09:00')}`,
      `DTEND:${dt('2026-01-15', '09:30')}`,
    ]));
    const events = parseIcalEvents(ics, '2026-01-15');
    expect(events).toHaveLength(1);
    expect(events[0].uid).toBe('test-1');
    expect(events[0].summary).toBe('Stand-up');
    expect(events[0].startMinutes).toBe(9 * 60);       // 540
    expect(events[0].endMinutes).toBe(9 * 60 + 30);    // 570
    expect(events[0].allDay).toBe(false);
  });

  it('falls back to "Busy" when SUMMARY is missing', () => {
    const ics = makeIcs(makeEvent([
      'UID:nosummary',
      `DTSTART:${dt('2026-01-15', '10:00')}`,
      `DTEND:${dt('2026-01-15', '11:00')}`,
    ]));
    const events = parseIcalEvents(ics, '2026-01-15');
    expect(events[0].summary).toBe('Busy');
  });

  it('generates a fallback UID when UID is missing', () => {
    const ics = makeIcs(makeEvent([
      'SUMMARY:No UID event',
      `DTSTART:${dt('2026-01-15', '14:00')}`,
      `DTEND:${dt('2026-01-15', '15:00')}`,
    ]));
    const events = parseIcalEvents(ics, '2026-01-15');
    expect(events).toHaveLength(1);
    expect(events[0].uid).toMatch(/^event-/);
  });

  it('defaults end to 1 hour after start when DTEND is absent', () => {
    const ics = makeIcs(makeEvent([
      'UID:noend',
      'SUMMARY:Quick thing',
      `DTSTART:${dt('2026-01-15', '11:00')}`,
    ]));
    const events = parseIcalEvents(ics, '2026-01-15');
    expect(events[0].startMinutes).toBe(11 * 60);
    expect(events[0].endMinutes).toBe(12 * 60);
  });

  it('returns multiple events on the same day', () => {
    const ics = makeIcs(
      makeEvent([
        'UID:ev-1',
        `DTSTART:${dt('2026-01-15', '09:00')}`,
        `DTEND:${dt('2026-01-15', '10:00')}`,
      ]),
      makeEvent([
        'UID:ev-2',
        `DTSTART:${dt('2026-01-15', '14:00')}`,
        `DTEND:${dt('2026-01-15', '15:00')}`,
      ]),
    );
    expect(parseIcalEvents(ics, '2026-01-15')).toHaveLength(2);
  });

  it('filters to only events matching the target date', () => {
    const ics = makeIcs(
      makeEvent([
        'UID:today',
        `DTSTART:${dt('2026-01-15', '09:00')}`,
        `DTEND:${dt('2026-01-15', '10:00')}`,
      ]),
      makeEvent([
        'UID:tomorrow',
        `DTSTART:${dt('2026-01-16', '09:00')}`,
        `DTEND:${dt('2026-01-16', '10:00')}`,
      ]),
    );
    const events = parseIcalEvents(ics, '2026-01-15');
    expect(events).toHaveLength(1);
    expect(events[0].uid).toBe('today');
  });

  it('skips a VEVENT block with no DTSTART', () => {
    const ics = makeIcs(makeEvent([
      'UID:nodtstart',
      'SUMMARY:Incomplete event',
    ]));
    expect(parseIcalEvents(ics, '2026-01-15')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('parseIcalEvents — all-day events', () => {
  it('parses a DATE-format all-day event', () => {
    const ics = makeIcs(makeEvent([
      'UID:allday-1',
      'SUMMARY:Holiday',
      'DTSTART;VALUE=DATE:20260115',
      'DTEND;VALUE=DATE:20260116',
    ]));
    const events = parseIcalEvents(ics, '2026-01-15');
    expect(events).toHaveLength(1);
    expect(events[0].allDay).toBe(true);
    expect(events[0].startMinutes).toBe(0);
    expect(events[0].endMinutes).toBe(24 * 60);
  });

  it('includes a multi-day event that spans the target date', () => {
    const ics = makeIcs(makeEvent([
      'UID:multiday',
      'SUMMARY:Conference',
      'DTSTART;VALUE=DATE:20260113',
      'DTEND;VALUE=DATE:20260118',
    ]));
    expect(parseIcalEvents(ics, '2026-01-15')).toHaveLength(1);
  });

  it('excludes a multi-day event whose exclusive end is the target date', () => {
    // DTEND in iCal all-day events is exclusive
    const ics = makeIcs(makeEvent([
      'UID:ended',
      'SUMMARY:Past event',
      'DTSTART;VALUE=DATE:20260113',
      'DTEND;VALUE=DATE:20260115', // ends before the 15th
    ]));
    expect(parseIcalEvents(ics, '2026-01-15')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('parseIcalEvents — line unfolding', () => {
  it('joins RFC 5545 continuation lines before parsing', () => {
    // A SUMMARY split across a continuation line
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:fold-test',
      `DTSTART:${dt('2026-01-15', '09:00')}`,
      `DTEND:${dt('2026-01-15', '10:00')}`,
      'SUMMARY:Long summ',
      ' ary here',        // continuation line (space prefix)
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const events = parseIcalEvents(ics, '2026-01-15');
    expect(events[0].summary).toBe('Long summary here');
  });
});

// ---------------------------------------------------------------------------

describe('parseIcalEvents — RRULE DAILY', () => {
  it('matches a daily recurring event on an occurrence day', () => {
    const ics = makeIcs(makeEvent([
      'UID:daily',
      'SUMMARY:Daily standup',
      `DTSTART:${dt('2026-01-01', '09:00')}`,
      `DTEND:${dt('2026-01-01', '09:30')}`,
      'RRULE:FREQ=DAILY',
    ]));
    expect(parseIcalEvents(ics, '2026-01-15')).toHaveLength(1);
  });

  it('preserves the time-of-day for a recurring event', () => {
    const ics = makeIcs(makeEvent([
      'UID:daily-time',
      `DTSTART:${dt('2026-01-01', '09:00')}`,
      `DTEND:${dt('2026-01-01', '09:30')}`,
      'RRULE:FREQ=DAILY',
    ]));
    const events = parseIcalEvents(ics, '2026-01-15');
    expect(events[0].startMinutes).toBe(9 * 60);
    expect(events[0].endMinutes).toBe(9 * 60 + 30);
  });

  it('does not match a date before DTSTART', () => {
    const ics = makeIcs(makeEvent([
      'UID:daily-future',
      `DTSTART:${dt('2026-01-20', '09:00')}`,
      `DTEND:${dt('2026-01-20', '10:00')}`,
      'RRULE:FREQ=DAILY',
    ]));
    expect(parseIcalEvents(ics, '2026-01-15')).toEqual([]);
  });

  it('respects DAILY INTERVAL=2 (every other day)', () => {
    // DTSTART Monday 2026-01-05; interval 2 → 5, 7, 9, 11, 13, 15, 17…
    const ics = makeIcs(makeEvent([
      'UID:every-other',
      `DTSTART:${dt('2026-01-05', '08:00')}`,
      `DTEND:${dt('2026-01-05', '09:00')}`,
      'RRULE:FREQ=DAILY;INTERVAL=2',
    ]));
    expect(parseIcalEvents(ics, '2026-01-15')).toHaveLength(1); // 5+10=15 ✓
    expect(parseIcalEvents(ics, '2026-01-16')).toHaveLength(0); // 16 is not in sequence
  });
});

// ---------------------------------------------------------------------------

describe('parseIcalEvents — RRULE WEEKLY', () => {
  // 2026-01-05 is a Monday
  it('matches a weekly event on the same day of week', () => {
    const ics = makeIcs(makeEvent([
      'UID:weekly-mon',
      `DTSTART:${dt('2026-01-05', '10:00')}`, // Monday
      `DTEND:${dt('2026-01-05', '11:00')}`,
      'RRULE:FREQ=WEEKLY',
    ]));
    // 2026-01-12 is also a Monday
    expect(parseIcalEvents(ics, '2026-01-12')).toHaveLength(1);
  });

  it('skips a weekly event on the wrong day of week', () => {
    const ics = makeIcs(makeEvent([
      'UID:weekly-tue',
      `DTSTART:${dt('2026-01-06', '10:00')}`, // Tuesday
      `DTEND:${dt('2026-01-06', '11:00')}`,
      'RRULE:FREQ=WEEKLY',
    ]));
    // 2026-01-12 is Monday
    expect(parseIcalEvents(ics, '2026-01-12')).toEqual([]);
  });

  it('matches weekly with BYDAY listing multiple days', () => {
    // Mon + Wed + Fri standup
    const ics = makeIcs(makeEvent([
      'UID:mwf',
      `DTSTART:${dt('2026-01-05', '09:00')}`, // Monday
      `DTEND:${dt('2026-01-05', '09:15')}`,
      'RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR',
    ]));
    expect(parseIcalEvents(ics, '2026-01-07')).toHaveLength(1); // Wednesday
    expect(parseIcalEvents(ics, '2026-01-09')).toHaveLength(1); // Friday
    expect(parseIcalEvents(ics, '2026-01-08')).toHaveLength(0); // Thursday
  });

  it('respects WEEKLY INTERVAL=2 (fortnightly)', () => {
    // Starts Mon 2026-01-05; every 2 weeks → 05, 19 Jan, 02 Feb…
    const ics = makeIcs(makeEvent([
      'UID:fortnightly',
      `DTSTART:${dt('2026-01-05', '14:00')}`,
      `DTEND:${dt('2026-01-05', '15:00')}`,
      'RRULE:FREQ=WEEKLY;INTERVAL=2',
    ]));
    expect(parseIcalEvents(ics, '2026-01-19')).toHaveLength(1); // +2 weeks ✓
    expect(parseIcalEvents(ics, '2026-01-12')).toHaveLength(0); // +1 week ✗
  });
});

// ---------------------------------------------------------------------------

describe('parseIcalEvents — RRULE MONTHLY', () => {
  it('matches a monthly event on the same day of the month', () => {
    const ics = makeIcs(makeEvent([
      'UID:monthly-15',
      `DTSTART:${dt('2026-01-15', '10:00')}`,
      `DTEND:${dt('2026-01-15', '11:00')}`,
      'RRULE:FREQ=MONTHLY',
    ]));
    expect(parseIcalEvents(ics, '2026-03-15')).toHaveLength(1);
  });

  it('skips a monthly event on the wrong day', () => {
    const ics = makeIcs(makeEvent([
      'UID:monthly-15',
      `DTSTART:${dt('2026-01-15', '10:00')}`,
      `DTEND:${dt('2026-01-15', '11:00')}`,
      'RRULE:FREQ=MONTHLY',
    ]));
    expect(parseIcalEvents(ics, '2026-03-16')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('parseIcalEvents — RRULE YEARLY', () => {
  it('matches a yearly event on the anniversary', () => {
    const ics = makeIcs(makeEvent([
      'UID:birthday',
      'SUMMARY:Birthday',
      `DTSTART:${dt('2020-06-15', '00:00')}`,
      'DTEND;VALUE=DATE:20200616',
      'RRULE:FREQ=YEARLY',
    ]));
    expect(parseIcalEvents(ics, '2026-06-15')).toHaveLength(1);
  });

  it('skips a yearly event on a non-anniversary day', () => {
    const ics = makeIcs(makeEvent([
      'UID:birthday',
      `DTSTART:${dt('2020-06-15', '00:00')}`,
      `DTEND:${dt('2020-06-15', '01:00')}`,
      'RRULE:FREQ=YEARLY',
    ]));
    expect(parseIcalEvents(ics, '2026-06-16')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('parseIcalEvents — RRULE UNTIL', () => {
  it('includes an occurrence before UNTIL', () => {
    const ics = makeIcs(makeEvent([
      'UID:until-test',
      `DTSTART:${dt('2026-01-01', '09:00')}`,
      `DTEND:${dt('2026-01-01', '10:00')}`,
      'RRULE:FREQ=DAILY;UNTIL=20260120',
    ]));
    expect(parseIcalEvents(ics, '2026-01-15')).toHaveLength(1);
  });

  it('excludes an occurrence after UNTIL', () => {
    const ics = makeIcs(makeEvent([
      'UID:until-test',
      `DTSTART:${dt('2026-01-01', '09:00')}`,
      `DTEND:${dt('2026-01-01', '10:00')}`,
      'RRULE:FREQ=DAILY;UNTIL=20260110',
    ]));
    expect(parseIcalEvents(ics, '2026-01-15')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('parseIcalEvents — RRULE COUNT', () => {
  it('includes an occurrence within COUNT', () => {
    // Daily from Jan 1, COUNT=20 → Jan 1–20 inclusive
    const ics = makeIcs(makeEvent([
      'UID:count-test',
      `DTSTART:${dt('2026-01-01', '10:00')}`,
      `DTEND:${dt('2026-01-01', '11:00')}`,
      'RRULE:FREQ=DAILY;COUNT=20',
    ]));
    expect(parseIcalEvents(ics, '2026-01-15')).toHaveLength(1);  // occurrence 15 of 20
  });

  it('excludes an occurrence beyond COUNT', () => {
    // Daily from Jan 1, COUNT=5 → Jan 1–5 only
    const ics = makeIcs(makeEvent([
      'UID:count-test',
      `DTSTART:${dt('2026-01-01', '10:00')}`,
      `DTEND:${dt('2026-01-01', '11:00')}`,
      'RRULE:FREQ=DAILY;COUNT=5',
    ]));
    expect(parseIcalEvents(ics, '2026-01-10')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('parseIcalEvents — EXDATE', () => {
  it('excludes a specific occurrence listed in EXDATE', () => {
    // Daily from Jan 1 but Jan 15 is excluded
    const ics = makeIcs(makeEvent([
      'UID:exdate-test',
      `DTSTART:${dt('2026-01-01', '09:00')}`,
      `DTEND:${dt('2026-01-01', '10:00')}`,
      'RRULE:FREQ=DAILY',
      `EXDATE:${dt('2026-01-15', '09:00')}`,
    ]));
    expect(parseIcalEvents(ics, '2026-01-15')).toEqual([]);
  });

  it('still includes other occurrences when one is excluded', () => {
    const ics = makeIcs(makeEvent([
      'UID:exdate-test',
      `DTSTART:${dt('2026-01-01', '09:00')}`,
      `DTEND:${dt('2026-01-01', '10:00')}`,
      'RRULE:FREQ=DAILY',
      `EXDATE:${dt('2026-01-15', '09:00')}`,
    ]));
    expect(parseIcalEvents(ics, '2026-01-16')).toHaveLength(1);
  });
});
