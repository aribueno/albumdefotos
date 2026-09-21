import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, SESSION_DURATION_SECONDS, createSessionToken } from '@/lib/auth';
import { sql } from '@/lib/db';

const MAX_FAILED_ATTEMPTS = 5;

function digest(value: string) {
  return createHash('sha256').update(value).digest();
}

function passwordMatches(input: unknown): boolean {
  const expected = process.env.SITE_PASSWORD;
  if (typeof input !== 'string' || !expected) return false;
  return timingSafeEqual(digest(input), digest(expected));
}

function clientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

// The attempt log is best effort: if the database is unreachable, login still works.
async function isBlocked(ip: string): Promise<boolean> {
  try {
    const [row] = await sql`
      SELECT COUNT(*)::int AS attempts FROM login_attempts
      WHERE ip = ${ip} AND attempted_at > now() - interval '10 minutes'
    `;
    return (row.attempts as number) >= MAX_FAILED_ATTEMPTS;
  } catch (error) {
    console.error('Falha ao consultar tentativas de login:', error);
    return false;
  }
}

async function recordFailure(ip: string) {
  try {
    await sql`INSERT INTO login_attempts (ip) VALUES (${ip})`;
    await sql`DELETE FROM login_attempts WHERE attempted_at < now() - interval '1 day'`;
  } catch (error) {
    console.error('Falha ao registrar tentativa de login:', error);
  }
}

async function clearFailures(ip: string) {
  try {
    await sql`DELETE FROM login_attempts WHERE ip = ${ip}`;
  } catch (error) {
    console.error('Falha ao limpar tentativas de login:', error);
  }
}

export async function POST(request: NextRequest) {
  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });
  }

  const ip = clientIp(request);

  if (await isBlocked(ip)) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' }, { status: 429 });
  }

  if (!passwordMatches(body.password)) {
    await recordFailure(ip);
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
  }

  await clearFailures(ip);

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  });
  return response;
}
