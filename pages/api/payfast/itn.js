// pages/api/payfast/itn.js
// Logs both the incoming Payfast signature and our rebuilt one for 1:1 comparison.

import crypto from "crypto";

export const config = {
  api: { bodyParser: false }, // we need the raw form body
};

function phpUrlEncode(val) {
  return encodeURIComponent(String(val))
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildSigStringItn(fields, passphrase = "") {
  const data = { ...fields };
  delete data.signature; // NEVER sign signature itself

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

    // ——— Build our signature exactly how Payfast should ———
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";
    const sigString  = buildSigStringItn(data, passphrase);
    const rebuiltSig = md5(sigString);
    const incoming   = data.signature || "";

    // Optional merchant check
    const SANDBOX   = process.env.PAYFAST_SANDBOX === "true";
    const expected  = SANDBOX ? "10000100" : process.env.PAYFAST_MERCHANT_ID_LIVE;

    // Lightly mask some fields for logs
    const masked = { ...data };
    if (masked.email_address) {
      const [u, d] = masked.email_address.split("@");
      masked.email_address = (u ? u[0] : "") + "***@" + (d || "");
    }

    // ——— CRITICAL LOG BLOCK ———
    console.log("=== Payfast ITN Debug ===");
    console.log("m_payment_id:", data.m_payment_id);
    console.log("payment_status:", data.payment_status);
    console.log("merchant_id (incoming):", data.merchant_id, "| expected:", expected);
    console.log("incoming signature:", incoming);
    console.log("rebuilt sigString:", sigString);
    console.log("rebuilt signature:", rebuiltSig);
    console.log("fields (masked):", masked);
    console.log("=========================");

    // Signature verify (still acknowledge 200 either way)
    if (!incoming || incoming !== rebuiltSig) {
      console.warn("Payfast ITN: signature mismatch");
      return res.status(200).send("Invalid signature");
    }

    if (!expected || data.merchant_id !== expected) {
      console.warn("Payfast ITN: unexpected merchant_id");
      return res.status(200).send("Merchant mismatch");
    }

    // Handle statuses if you want to unlock access:
    // const status = (data.payment_status || "").toUpperCase(); // COMPLETE | PENDING | FAILED
    // if (status === "COMPLETE") { /* grant access */ }

    return res.status(200).send("ITN received");
  } catch (e) {
    console.error("ITN handler error:", e);
    return res.status(200).send("ITN error logged");
  }
}
