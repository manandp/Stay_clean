/**
 * Install tokens. The app has no accounts, so each install gets a random id
 * and a signed, short-lived token (HMAC-SHA256). The token carries nothing
 * about the person.
 */

export const TOKEN_TTL_SECONDS = 24 * 60 * 60;

interface TokenPayload {
  iid: string;
  exp: number;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function issueToken(secret: string, nowSeconds: number): Promise<{ token: string; installId: string; expiresAt: number }> {
  const installId = crypto.randomUUID();
  const payload: TokenPayload = { iid: installId, exp: nowSeconds + TOKEN_TTL_SECONDS };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(body)));
  return { token: `${body}.${toBase64Url(sig)}`, installId, expiresAt: payload.exp };
}

/** Returns the install id for a valid, unexpired token, otherwise null. */
export async function verifyToken(secret: string, token: string, nowSeconds: number): Promise<string | null> {
  const [body, sig, extra] = token.split('.');
  if (!body || !sig || extra !== undefined) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromBase64Url(sig), encoder.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as Partial<TokenPayload>;
    if (typeof payload.iid !== 'string' || typeof payload.exp !== 'number' || payload.exp < nowSeconds) return null;
    return payload.iid;
  } catch {
    return null;
  }
}
