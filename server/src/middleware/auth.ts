import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

let cachedToken: string | null = null;

function getApiToken(): string {
  if (cachedToken) return cachedToken;

  let token = process.env.API_TOKEN;

  if (!token || token.trim() === '') {
    // Generate a token and save it to .env
    token = uuidv4();
    const envPath = path.join(__dirname, '..', '..', '.env');

    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Replace existing API_TOKEN line or append
    if (envContent.includes('API_TOKEN=')) {
      envContent = envContent.replace(/API_TOKEN=.*/, `API_TOKEN=${token}`);
    } else {
      envContent += `${envContent && !envContent.endsWith('\n') ? '\n' : ''}API_TOKEN=${token}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf-8');
    process.env.API_TOKEN = token;

    console.log('');
    console.log('='.repeat(60));
    console.log('  Generated API token (saved to .env):');
    console.log(`  ${token}`);
    console.log('='.repeat(60));
    console.log('');
  }

  cachedToken = token;
  return token;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-api-token'] as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Missing X-API-Token header' });
    return;
  }

  const expectedToken = getApiToken();

  if (token !== expectedToken) {
    res.status(403).json({ error: 'Invalid API token' });
    return;
  }

  next();
}
