// pages/api/payfast/itn.js
import crypto from "crypto";

export const config = { api: { bodyParser: false } };

function phpUrlEncode(val) {
  return encodeURIComponent(String(val))
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}
const md5 = s => crypto.createHash("md5").update(s).digest("hex");

function buildSigStringItn(fields, passphrase="") {
  const data = { ...fields };
  delete data.signature;
  // EXCLUDE merchant_key from signing
  const pairs = Object.keys(data)
    .filter(k =>
      k !== "merchant_key" &&
      data[k] !== undefined && data[k] !== null && data[k] !== ""
    )
    .sort()
    .map(k => `${k}=${phpUrlEncode(data[k])}`);
  if (passphrase) pairs.push(`passphrase=${phpUrlEncode(passphrase)}`);
  return pairs.join("&");
}

async function readRawBody(req) { const chunks=[]; for await (const c of req) chunks.push(c); return Buffer.concat(chunks); }
function parseForm(buf) { const params = new URLSearchParams(buf.toString("utf8")); const o={}; for (const [k,v] of params) o[k]=v; return o; }

export default async function itnHandler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const data = parseForm(await readRawBody(req));

    const passphrase = process.env.PAYFAST_PASSPHRASE || "";
    const rebuilt = md5(buildSigStringItn(data, passphrase));
    if (!data.signature || data.signature !== rebuilt) {
      console.warn("Payfast ITN: signature mismatch", { incoming: data.signature, rebuilt });
      return res.status(200).send("Invalid signature");
    }

    const SANDBOX = process.env.PAYFAST_SANDBOX === "true";
    const expected = SANDBOX ? "10000100" : process.env.PAYFAST_MERCHANT_ID_LIVE;
    if (!expected || data.merchant_id !== expected) {
      console.warn("Payfast ITN: unexpected merchant_id", { got: data.merchant_id, expected });
      return res.status(200).send("Merchant mismatch");
    }

    // Handle statuses if you want…
    return res.status(200).send("ITN received");
  } catch (e) {
    console.error("ITN handler error:", e);
    return res.status(200).send("ITN error logged");
  }
}
