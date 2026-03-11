/**
 * Pluggable email service.
 *
 * Configure via environment variables:
 *   EMAIL_PROVIDER   mailgun | log   (default: mailgun if MAILGUN_API_KEY is set, else log)
 *
 * Mailgun (EMAIL_PROVIDER=mailgun):
 *   MAILGUN_API_KEY   Your Mailgun API key
 *   MAILGUN_DOMAIN    Your sending domain (e.g. mg.example.com)
 *   MAILGUN_FROM      From address (default: noreply@{MAILGUN_DOMAIN})
 *   MAILGUN_REGION    us | eu  (default: us)
 *
 * Log (EMAIL_PROVIDER=log):
 *   Prints email content to stdout. Useful for development.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

async function sendMailgun(msg: EmailMessage): Promise<void> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAILGUN_FROM || `noreply@${domain}`;
  const region = (process.env.MAILGUN_REGION || 'us').toLowerCase();

  if (!apiKey || !domain) {
    throw new Error('MAILGUN_API_KEY and MAILGUN_DOMAIN must be set when EMAIL_PROVIDER=mailgun');
  }

  const apiBase = region === 'eu'
    ? 'https://api.eu.mailgun.net/v3'
    : 'https://api.mailgun.net/v3';

  const params = new URLSearchParams({ from, to: msg.to, subject: msg.subject, text: msg.text });
  if (msg.html) params.set('html', msg.html);

  const res = await fetch(`${apiBase}/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Mailgun error ${res.status}: ${body}`);
  }
}

function logEmail(msg: EmailMessage): void {
  console.log('\n========== EMAIL (log provider) ==========');
  console.log(`To:      ${msg.to}`);
  console.log(`Subject: ${msg.subject}`);
  console.log(`\n${msg.text}`);
  console.log('==========================================\n');
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase()
    || (process.env.MAILGUN_API_KEY ? 'mailgun' : 'log');

  switch (provider) {
    case 'mailgun':
      return sendMailgun(msg);
    case 'log':
      logEmail(msg);
      return;
    default:
      throw new Error(
        `Unknown EMAIL_PROVIDER: "${process.env.EMAIL_PROVIDER}". Supported values: mailgun, log`,
      );
  }
}
