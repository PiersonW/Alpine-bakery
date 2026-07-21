import crypto from "crypto";

const COOKIE_NAME = "alpine_admin_session";

function sign(value) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

// Builds the value we store in the cookie: today's date + a signature.
// Rotating daily means a stale/leaked cookie stops working automatically after 24h.
export function makeSessionToken() {
  const day = new Date().toISOString().slice(0, 10);
  return `${day}.${sign(day)}`;
}

export function isValidSessionToken(token) {
  if (!token || !token.includes(".")) return false;
  const [day, sig] = token.split(".");
  return sig === sign(day);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
