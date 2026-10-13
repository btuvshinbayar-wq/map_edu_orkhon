// Firebase ID token (RS256 JWT)-ийг Admin SDK-гүйгээр, WebCrypto-оор шалгана.
export interface Jwk { kid: string; kty: string; n: string; e: string; alg?: string; use?: string }

const b64urlToBytes = (s: string): Uint8Array<ArrayBuffer> => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
const decodeJson = (s: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

export interface VerifiedToken { uid: string; email?: string }

export async function verifyIdToken(
  token: string,
  projectId: string,
  jwks: Jwk[],
  nowSec = Math.floor(Date.now() / 1000),
): Promise<VerifiedToken> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('bad token format');
  const header = decodeJson(parts[0]);
  const payload = decodeJson(parts[1]);
  if (header.alg !== 'RS256') throw new Error('bad alg');
  const jwk = jwks.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown key id');

  const key = await crypto.subtle.importKey(
    'jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true } as JsonWebKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
  );
  const ok = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!ok) throw new Error('bad signature');

  if (payload.aud !== projectId) throw new Error('bad audience');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('bad issuer');
  if (typeof payload.exp !== 'number' || payload.exp < nowSec) throw new Error('token expired');
  if (typeof payload.iat === 'number' && payload.iat > nowSec + 300) throw new Error('token from future');
  if (!payload.sub || typeof payload.sub !== 'string') throw new Error('no subject');
  return { uid: payload.sub, email: payload.email };
}

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let cache: { keys: Jwk[]; at: number } | null = null;

export async function fetchJwks(): Promise<Jwk[]> {
  if (cache && Date.now() - cache.at < 3600_000) return cache.keys;
  const r = await fetch(JWKS_URL);
  if (!r.ok) throw new Error('jwks fetch failed');
  const { keys } = (await r.json()) as { keys: Jwk[] };
  cache = { keys, at: Date.now() };
  return keys;
}
