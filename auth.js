const COOKIE_NAME = "alpine_admin_session";

// Uses the Web Crypto API (built into both browsers and modern Node)
// instead of Node's "crypto" module, since Next.js runs middleware.js
// in a lightweight "Edge" runtime that doesn't support Node's version.
async function sign(value) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Builds the value we store in the cookie: today's date + a signature.
// Rotating daily means a stale/leaked cookie stops working automatically after 24h.
export async function makeSessionToken() {
  const day = new Date().toISOString().slice(0, 10);
  return `${day}.${await sign(day)}`;
}

export async function isValidSessionToken(token) {
  if (!token || !token.includes(".")) return false;
  const [day, sig] = token.split(".");
  return sig === (await sign(day));
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
