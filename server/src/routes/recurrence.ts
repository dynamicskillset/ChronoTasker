import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';

const router = Router();

interface TaskRow {
  id: string;
  title: string;
  duration_minutes: number;
  fixed_start_time: string | null;
  important: number;
  is_break: number;
  tag: string | null;
  details: string | null;
  recurrence_pattern: string;
  date: string;
  sort_order: number;
}

function matchesPattern(pattern: string, templateDate: string, targetDate: string): boolean {
  const target = new Date(targetDate + 'T00:00:00');
  const template = new Date(templateDate + 'T00:00:00');

  // Only generate for dates on or after the template date
  if (target < template) return false;

  switch (pattern) {
    case 'daily':
      return true;
    case 'weekdays': {
      const day = target.getDay();
      return day >= 1 && day <= 5;
    }
    case 'weekly':
      return target.getDay() === template.getDay();
    case 'monthly':
      return target.getDate() === template.getDate();
    default:
      return false;
  }
}

// POST /api/recurrence/generate
router.post('/generate', (req: Request, res: Response) => {
  const { date } = req.body;

  if (!date || typeof date !== 'string') {
    res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
    return;
  }

  const db = getDb();

  // Find all recurring templates (tasks with recurrence_pattern set and no recurrence_source_id)
  const templates = db.prepare(
    'SELECT * FROM tasks WHERE recurrence_pattern IS NOT NULL AND recurrence_source_id IS NULL'
  ).all() as TaskRow[];

  const created: unknown[] = [];
  const now = new Date().toISOString();

  const findInstance = db.prepare(
    'SELECT id FROM tasks WHERE recurrence_source_id = ? AND date = ?'
  );

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, title, duration_minutes, fixed_start_time, completed, important, is_break, tag, details, recurrence_pattern, recurrence_source_id, sort_order, date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const template of templates) {
    if (!matchesPattern(template.recurrence_pattern, template.date, date)) continue;

    // Skip if an instance already exists for this date+source
    const existing = findInstance.get(template.id, date);
    if (existing) continue;

    // Skip if the template itself is on this date (don't duplicate the original)
    if (template.date === date) continue;

    const newId = uuidv4();
    insertTask.run(
      newId,
      template.title,
      template.duration_minutes,
      template.fixed_start_time,
      0, // not completed
      template.important,
      template.is_break,
      template.tag,
      template.details,
      null, // instances don't have their own recurrence_pattern
      template.id, // recurrence_source_id points to template
      template.sort_order,
      date,
      now,
      now
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(newId);
    created.push(task);
  }

  res.json({ created });
});

export default router;
