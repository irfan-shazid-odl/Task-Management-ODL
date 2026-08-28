const ALGO = 'AES-GCM';
const KEY_LEN = 256;
const ITERATIONS = 100000;
const HASH = 'SHA-256';

function getSalt(userId: string): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  return encoder.encode(`opencode-vault-${userId}`) as unknown as Uint8Array<ArrayBuffer>;
}

function keyFromPassword(userId: string): Promise<CryptoKey> {
  const salt = getSalt(userId);
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(userId) as unknown as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  ).then(baseKey =>
    crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: HASH } as Pbkdf2Params,
      baseKey,
      { name: ALGO, length: KEY_LEN },
      false,
      ['encrypt', 'decrypt']
    )
  );
}

function iv(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(12)) as unknown as Uint8Array<ArrayBuffer>;
}

export async function encrypt(plaintext: string, userId: string): Promise<string> {
  const key = await keyFromPassword(userId);
  const nonce = iv();
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: ALGO, iv: nonce }, key, encoded as BufferSource);
  const combined = new Uint8Array(nonce.length + encrypted.byteLength);
  combined.set(nonce, 0);
  combined.set(new Uint8Array(encrypted), nonce.length);
  // Base64-encode in chunks: spreading the whole array into
  // String.fromCharCode(...) overflows the call stack for larger payloads
  // (long notes/URLs), throwing RangeError. Chunking also avoids the
  // spread-literal argument limit that V8 caps at ~64k.
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < combined.length; i += CHUNK) {
    binary += String.fromCharCode(...combined.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export async function decrypt(ciphertext: string, userId: string): Promise<string> {
  const key = await keyFromPassword(userId);
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const nonce = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv: nonce as BufferSource }, key, data as BufferSource);
  return new TextDecoder().decode(decrypted);
}
