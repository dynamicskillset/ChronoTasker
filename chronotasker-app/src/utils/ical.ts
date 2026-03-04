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

    const dtstartInfo = findPropertyWithTzid(block, 'DTSTART');
    const dtendInfo = findPropertyWithTzid(block, 'DTEND');

    if (!dtstartInfo) continue;

    const start = parseIcalDate(dtstartInfo.value, dtstartInfo.tzid);
    if (!start) continue;

    const allDay = dtstartInfo.value.length === 8; // YYYYMMDD format (no time)

    let end: { date: string; minutes: number } | null = null;
    if (dtendInfo) {
      end = parseIcalDate(dtendInfo.value, dtendInfo.tzid);
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

/** Find a property and extract its value and optional TZID parameter */
function findPropertyWithTzid(block: string, prefix: string): { value: string; tzid?: string } | null {
  const lines = block.split('\n');
  for (const line of lines) {
    if (line.startsWith(prefix)) {
      const colonIdx = line.indexOf(':');
      if (colonIdx < 0) continue;
      const value = line.slice(colonIdx + 1).trim();
      if (!value) continue;

      // Extract TZID from parameters (e.g., DTSTART;TZID=Europe/London:...)
      const paramStr = line.slice(prefix.length, colonIdx);
      const tzidMatch = paramStr.match(/TZID=([^;:]+)/);
      return { value, tzid: tzidMatch?.[1] };
    }
  }
  return null;
}

/**
 * Parse an iCal datetime value into a local date string and minutes from midnight.
 * Supports:
 *   - 20250301T140000Z (UTC)
 *   - 20250301T140000 with tzid (converted from that timezone to local)
 *   - 20250301T140000 without tzid (treated as local)
 *   - 20250301 (all-day DATE)
 */
function parseIcalDate(value: string, tzid?: string): { date: string; minutes: number } | null {
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
    return dateToLocal(utcDate);
  }

  if (tzid) {
    // Convert from the specified timezone to local time
    const localDate = convertFromTzid(year, month, day, hour, minute, tzid);
    if (localDate) return dateToLocal(localDate);
    // Fall through to treat as local if TZID is invalid
  }

  // Local time (no TZID, no Z suffix)
  const dateStr = `${year}-${month}-${day}`;
  const minutes = parseInt(hour) * 60 + parseInt(minute);
  return { date: dateStr, minutes };
}

/** Extract local date string and minutes from a JS Date */
function dateToLocal(d: Date): { date: string; minutes: number } {
  const localYear = d.getFullYear();
  const localMonth = String(d.getMonth() + 1).padStart(2, '0');
  const localDay = String(d.getDate()).padStart(2, '0');
  return {
    date: `${localYear}-${localMonth}-${localDay}`,
    minutes: d.getHours() * 60 + d.getMinutes(),
  };
}

/**
 * Convert a datetime from a named timezone to the user's local time.
 * Uses Intl offset trick: find the timezone's UTC offset, then create a proper UTC Date.
 */
function convertFromTzid(
  year: string, month: string, day: string,
  hour: string, minute: string, tzid: string,
): Date | null {
  try {
    // 1. Treat the time as if it were UTC
    const assumedUtc = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
    // 2. Format that UTC instant in the target timezone to find the offset
    const inTz = new Date(assumedUtc.toLocaleString('en-US', { timeZone: tzid }));
    const offsetMs = inTz.getTime() - assumedUtc.getTime();
    // 3. The actual UTC time is the assumed time minus the offset
    return new Date(assumedUtc.getTime() - offsetMs);
  } catch {
    // Invalid TZID — fall back to treating as local
    return null;
  }
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
