import { verifyIdToken, type Jwk } from '../functions/_lib/verifyIdToken.ts';
const assert = (c: boolean, m: string) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const b64u = (b: ArrayBuffer | string) => Buffer.from(typeof b === 'string' ? b : new Uint8Array(b)).toString('base64url');

const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const pub = (await crypto.subtle.exportKey('jwk', publicKey)) as any;
const jwks: Jwk[] = [{ kid: 'k1', kty: 'RSA', n: pub.n, e: pub.e }];

async function mint(over: Record<string, unknown> = {}, kid = 'k1', key = privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const h = b64u(JSON.stringify({ alg: 'RS256', kid }));
  const p = b64u(JSON.stringify({ aud: 'proj', iss: 'https://securetoken.google.com/proj', sub: 'user123', email: 'a@b.mn', iat: now - 10, exp: now + 3600, ...over }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64u(sig)}`;
}
const fails = async (t: string) => { try { await verifyIdToken(t, 'proj', jwks); return false; } catch { return true; } };

const ok = await verifyIdToken(await mint(), 'proj', jwks);
assert(ok.uid === 'user123' && ok.email === 'a@b.mn', 'зөв токен хүлээн авна');
assert(await fails(await mint({ exp: Math.floor(Date.now() / 1000) - 5 })), 'хугацаа дууссан токен татгалзана');
assert(await fails(await mint({ aud: 'other' })), 'өөр төслийн токен татгалзана');
assert(await fails(await mint({ iss: 'https://evil.example/proj' })), 'буруу issuer татгалзана');
assert(await fails(await mint({}, 'unknown')), 'үл мэдэгдэх key id татгалзана');
const other = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
assert(await fails(await mint({}, 'k1', other.privateKey)), 'хуурамч гарын үсэгтэй токен татгалзана');
const t = await mint(); const [h, p, s] = t.split('.');
assert(await fails(`${h}.${b64u(JSON.stringify({ aud: 'proj', iss: 'https://securetoken.google.com/proj', sub: 'admin', exp: 9999999999, iat: 1 }))}.${s}`), 'агуулгыг өөрчилсөн токен татгалзана');
