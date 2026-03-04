import type { CalendarEvent } from '../types';

/**
 * Parse iCal text and return events that overlap a target date.
 * Handles: line unfolding, VEVENT extraction, DTSTART/DTEND (UTC, TZID, and DATE formats).
 * Does NOT handle RRULE (recurring events) in v1.
 */
export function parseIcalEvents(icsText: string, targetDate: string): CalendarEvent[] {
  // Step 1: Unfold lines (RFC 5545 §3.1 — continuation lines start with space or tab)
  const unfolded = icsText.replace(/\r\n[ \t]/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Step 2: Extract VEVENT blocks
  const events: CalendarEvent[] = [];
  const vevents = unfolded.split('BEGIN:VEVENT');

  for (let i = 1; i < vevents.length; i++) {
    const block = vevents[i].split('END:VEVENT')[0];
    if (!block) continue;

    const props = parseProperties(block);

    const uid = props['UID'] || `event-${i}`;
    const summary = props['SUMMARY'] || 'Busy';

    const dtstart = props['DTSTART'] || findPrefixedProp(block, 'DTSTART');
    const dtend = props['DTEND'] || findPrefixedProp(block, 'DTEND');

    if (!dtstart) continue;

    const start = parseIcalDate(dtstart);
    if (!start) continue;

    const allDay = dtstart.length === 8; // YYYYMMDD format (no time)

    let end: { date: string; minutes: number } | null = null;
    if (dtend) {
      end = parseIcalDate(dtend);
    }

    // Check if event overlaps the target date
    if (!overlapsDate(start, end, allDay, targetDate)) continue;

    if (allDay) {
      events.push({ uid, summary, startMinutes: 0, endMinutes: 24 * 60, allDay: true });
    } else {
      // Clamp to target date boundaries
      const startMin = start.date === targetDate ? start.minutes : 0;
      const endMin = end
        ? (end.date === targetDate ? end.minutes : 24 * 60)
        : Math.min(startMin + 60, 24 * 60); // default 1h if no end

      events.push({ uid, summary, startMinutes: startMin, endMinutes: endMin, allDay: false });
    }
  }

  return events;
}

/** Parse simple KEY:VALUE properties from a VEVENT block */
function parseProperties(block: string): Record<string, string> {
  const props: Record<string, string> = {};
  const lines = block.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx);
    const value = line.slice(colonIdx + 1).trim();
    // Strip parameters (e.g., DTSTART;TZID=...:20250101T090000)
    const baseKey = key.split(';')[0];
    if (!props[baseKey]) {
      props[baseKey] = value;
    }
  }
  return props;
}

/** Find a property that may have parameters (e.g., DTSTART;TZID=Europe/London:20250101T090000) */
function findPrefixedProp(block: string, prefix: string): string | null {
  const lines = block.split('\n');
  for (const line of lines) {
    if (line.startsWith(prefix)) {
      const colonIdx = line.indexOf(':');
      if (colonIdx >= 0) {
        return line.slice(colonIdx + 1).trim();
      }
    }
  }
  return null;
}

/**
 * Parse an iCal datetime value into a local date string and minutes from midnight.
 * Supports:
 *   - 20250301T140000Z (UTC)
 *   - 20250301T140000 (local/TZID — treated as local)
 *   - 20250301 (all-day DATE)
 */
function parseIcalDate(value: string): { date: string; minutes: number } | null {
  // All-day: YYYYMMDD
  if (/^\d{8}$/.test(value)) {
    const date = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    return { date, minutes: 0 };
  }

  // DateTime: YYYYMMDDTHHmmss or YYYYMMDDTHHmmssZ
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\w*)$/);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const isUtc = value.endsWith('Z');

  if (isUtc) {
    // Convert UTC to local time
    const utcDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
    const localYear = utcDate.getFullYear();
    const localMonth = String(utcDate.getMonth() + 1).padStart(2, '0');
    const localDay = String(utcDate.getDate()).padStart(2, '0');
    const localDateStr = `${localYear}-${localMonth}-${localDay}`;
    const minutes = utcDate.getHours() * 60 + utcDate.getMinutes();
    return { date: localDateStr, minutes };
  }

  // Local time (or TZID — treat as local for now)
  const dateStr = `${year}-${month}-${day}`;
  const minutes = parseInt(hour) * 60 + parseInt(minute);
  return { date: dateStr, minutes };
}

/** Check if an event overlaps a target date (YYYY-MM-DD) */
function overlapsDate(
  start: { date: string; minutes: number },
  end: { date: string; minutes: number } | null,
  allDay: boolean,
  targetDate: string,
): boolean {
  if (allDay) {
    // All-day event: start.date is the day, end.date (if present) is exclusive
    if (start.date === targetDate) return true;
    if (end && start.date <= targetDate && targetDate < end.date) return true;
    return false;
  }

  // Timed event
  const endDate = end?.date || start.date;

  // Event spans from start.date to endDate
  if (start.date <= targetDate && endDate >= targetDate) return true;

  return false;
}
