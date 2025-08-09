// pages/api/payfast/itn.js
// Parses x-www-form-urlencoded ITN, verifies signature using PHP-style urlencode,
// mirrors signing rule (all posted fields except 'signature'), and acknowledges with 200.

import crypto from "crypto";

export const config = {
  api: { bodyParser: false }, // we need raw form body
};

function phpUrlEncode(val) {
  return encodeURIComponent(String(val))
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildSigStringItn(fields, passphrase = "") {
  const data = { ...fields };
  delete data.signature; // never sign signature itself

  const pairs = Object.keys(data)
    .filter(k => data[k] !== undefined && data[k] !== null && data[k] !== "")
    .sort()
    .map(k => `${k}=${phpUrlEncode(data[k])}`);

  if (passphrase) pairs.push(`passphrase=${phpUrlEncode(passphrase)}`);
  return pairs.join("&");
}

const md5 = s => crypto.createHash("md5").update(s).digest("hex");

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function parseForm(buf) {
  const params = new URLSearchParams(buf.toString("utf8"));
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

export default async function itnHandler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const raw  = await readRawBody(req);
    const data = parseForm(raw);

    const passphrase = process.env.PAYFAST_PASSPHRASE || "";
    const rebuiltSig = md5(buildSigStringItn(data, passphrase));
    const incoming   = data.signature;

    if (!incoming || incoming !== rebuiltSig) {
      console.warn("Payfast ITN: signature mismatch", { incoming, rebuiltSig });
      return res.status(200).send("Invalid signature");
    }

    // Optional merchant check (sandbox vs live)
    const SANDBOX = process.env.PAYFAST_SANDBOX === "true";
    const expected = SANDBOX ? "10000100" : process.env.PAYFAST_MERCHANT_ID_LIVE;
    if (!expected || data.merchant_id !== expected) {
      console.warn("Payfast ITN: unexpected merchant_id", { got: data.merchant_id, expected });
      return res.status(200).send("Merchant mismatch");
    }

    // Handle status if you want to unlock access
    // const status = (data.payment_status || "").toUpperCase(); // COMPLETE | PENDING | FAILED
    // const orderRef = data.m_payment_id || data.custom_str1 || "unknown";
    // if (status === "COMPLETE") { /* grant access */ }

    return res.status(200).send("ITN received");
  } catch (e) {
    console.error("ITN handler error:", e);
    return res.status(200).send("ITN error logged");
  }
}
