import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/calendar/fetch?url=<encoded-ical-url>
// Proxies the iCal feed to avoid CORS issues in the browser.
router.get('/fetch', async (req: Request, res: Response) => {
  const url = req.query.url as string | undefined;

  if (!url) {
    res.status(400).json({ error: 'Missing "url" query parameter' });
    return;
  }

  // Basic URL validation
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    res.status(400).json({ error: 'URL must use http or https' });
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'text/calendar, text/plain' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(502).json({ error: `Upstream returned ${response.status}` });
      return;
    }

    const text = await response.text();

    if (!text.includes('BEGIN:VCALENDAR')) {
      res.status(422).json({ error: 'Response does not appear to be a valid iCal feed' });
      return;
    }

    res.type('text/calendar').send(text);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'Upstream request timed out (10s)' });
      return;
    }
    res.status(502).json({ error: 'Failed to fetch calendar feed' });
  }
});

export default router;
