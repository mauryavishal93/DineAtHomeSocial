/**
 * Browser-only E2E for host–guest chat: ECDH P-256 + AES-GCM.
 * Server stores only public JWKs and ciphertext (ENC1:...); shared AES key never leaves the client.
 */

const STORAGE_PREFIX = "dah-chat-ecdh:";
const AES_CACHE = new Map<string, CryptoKey>();

type StoredKeys = { privateJwk: JsonWebKey; publicJwk: JsonWebKey };

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function b64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function isEncryptedPayload(text: string): boolean {
  return typeof text === "string" && text.startsWith("ENC1:");
}

export type CryptoState = {
  aesKey: CryptoKey | null;
  ready: boolean;
};

function loadStored(bookingId: string): StoredKeys | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${bookingId}`);
    if (!raw) return null;
    return JSON.parse(raw) as StoredKeys;
  } catch {
    return null;
  }
}

function saveStored(bookingId: string, keys: StoredKeys) {
  sessionStorage.setItem(`${STORAGE_PREFIX}${bookingId}`, JSON.stringify(keys));
}

export async function getChatAesKey(
  bookingId: string,
  token: string,
  side: "host" | "guest"
): Promise<CryptoState> {
  if (typeof window === "undefined" || !crypto?.subtle) {
    return { aesKey: null, ready: false };
  }

  const headers = { authorization: `Bearer ${token}` };

  const res = await fetch(`/api/chat/crypto?bookingId=${encodeURIComponent(bookingId)}`, { headers });
  const json = await res.json().catch(() => null);
  const data = json?.data ?? json;
  if (!res.ok) return { aesKey: null, ready: false };

  let guestPub: JsonWebKey | null = data.guestPublicJwk ?? null;
  let hostPub: JsonWebKey | null = data.hostPublicJwk ?? null;

  let stored = loadStored(bookingId);
  if (!stored) {
    const keyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
      "deriveKey",
      "deriveBits"
    ]);
    const publicJwk = (await crypto.subtle.exportKey("jwk", keyPair.publicKey)) as JsonWebKey;
    const privateJwk = (await crypto.subtle.exportKey("jwk", keyPair.privateKey)) as JsonWebKey;
    stored = { privateJwk, publicJwk };
    saveStored(bookingId, stored);

    const post = await fetch("/api/chat/crypto", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, publicJwk })
    });
    const postJson = await post.json().catch(() => null);
    const pd = postJson?.data ?? postJson;
    if (post.ok) {
      guestPub = pd.guestPublicJwk ?? guestPub;
      hostPub = pd.hostPublicJwk ?? hostPub;
    }
  } else {
    const myPubMissing =
      (side === "guest" && !guestPub) || (side === "host" && !hostPub);
    if (myPubMissing) {
      const post = await fetch("/api/chat/crypto", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, publicJwk: stored.publicJwk })
      });
      const postJson = await post.json().catch(() => null);
      const pd = postJson?.data ?? postJson;
      if (post.ok) {
        guestPub = pd.guestPublicJwk ?? guestPub;
        hostPub = pd.hostPublicJwk ?? hostPub;
      }
    }
  }

  const otherJwk = side === "guest" ? hostPub : guestPub;
  if (!otherJwk) {
    return { aesKey: null, ready: false };
  }

  const cached = AES_CACHE.get(bookingId);
  if (cached) {
    return { aesKey: cached, ready: true };
  }

  const privateKey = await crypto.subtle.importKey(
    "jwk",
    stored.privateJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"]
  );
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    otherJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const bits = await crypto.subtle.deriveBits({ name: "ECDH", public: publicKey }, privateKey, 256);
  const aesRaw = await crypto.subtle.digest("SHA-256", bits);
  const aesKey = await crypto.subtle.importKey("raw", aesRaw, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt"
  ]);

  AES_CACHE.set(bookingId, aesKey);
  return { aesKey, ready: true };
}

export async function encryptChatMessage(plain: string, aesKey: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plain);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, enc);
  const payload = JSON.stringify({
    iv: bufToB64(iv.buffer),
    ct: bufToB64(ct)
  });
  return `ENC1:${btoa(payload)}`;
}

export async function decryptChatMessage(stored: string, aesKey: CryptoKey): Promise<string> {
  if (!stored.startsWith("ENC1:")) return stored;
  const b64 = stored.slice(5);
  const { iv, ct } = JSON.parse(atob(b64)) as { iv: string; ct: string };
  const ivBuf = b64ToBuf(iv);
  const ctBuf = b64ToBuf(ct);
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(ivBuf) }, aesKey, ctBuf);
  return new TextDecoder().decode(dec);
}
