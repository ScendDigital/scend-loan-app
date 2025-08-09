// pages/api/payfast/itn.js
// Verify Payfast ITN using PHP-style urlencode and the same rules:
// Exclude 'signature' and 'merchant_key' from the sig string. Always 200 OK.

import crypto from "crypto";

export const config = { api: { bodyParser: false } };

function phpUrlEncode(val) {
  return encodeURIComponent(String(val))
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildSigStringItn(fields, passphrase = "") {
  const data = { ...fields };
  delete data.signature; // never sign signature

  const pairs = Object.keys(data)
    .filter(k =>
      k !== "merchant_key" && // EXCLUDE merchant_key here too
      data[k] !== undefined && data[k] !== null && data[k] !== ""
    )
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
    const sigString  = buildSigStringItn(data, passphrase);
    const rebuiltSig = md5(sigString);
    const incoming   = data.signature || "";

    // Debug block: side-by-side comparison
    console.log("=== Payfast ITN Debug ===");
    console.log("m_payment_id:", data.m_payment_id);
    console.log("payment_status:", data.payment_status);
    console.log("incoming signature:", incoming);
    console.log("rebuilt sigString:", sigString);
    console.log("rebuilt signature:", rebuiltSig);
    console.log("=========================");

    if (!incoming || incoming !== rebuiltSig) {
      console.warn("Payfast ITN: signature mismatch");
      return res.status(200).send("Invalid signature");
    }

    // Optional merchant check
    const SANDBOX = process.env.PAYFAST_SANDBOX === "true";
    const expected = SANDBOX ? "10000100" : process.env.PAYFAST_MERCHANT_ID_LIVE;
    if (!expected || data.merchant_id !== expected) {
      console.warn("Payfast ITN: unexpected merchant_id", { got: data.merchant_id, expected });
      return res.status(200).send("Merchant mismatch");
    }

    // TODO: handle COMPLETE | PENDING | FAILED if you want to unlock access here

    return res.status(200).send("ITN received");
  } catch (e) {
    console.error("ITN handler error:", e);
    return res.status(200).send("ITN error logged");
  }
}
