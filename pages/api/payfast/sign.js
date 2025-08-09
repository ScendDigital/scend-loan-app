// pages/api/payfast/sign.js
// Minimal payload to debug Payfast signature mismatch.
// Signature = MD5 of ALL posted fields except 'signature'. (merchant_key IS included)

import crypto from "crypto";

function phpUrlEncode(v) {
  return encodeURIComponent(String(v))
    .replace(/%20/g, "+")    // space -> +
    .replace(/~/g, "%7E")    // ~ -> %7E (PHP urlencode)
    .replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildSigString(fields, passphrase = "") {
  const pairs = Object.keys(fields)
    .filter(k => k !== "signature" && fields[k] !== undefined && fields[k] !== null && fields[k] !== "")
    .sort()
    .map(k => `${k}=${phpUrlEncode(fields[k])}`);
  if (passphrase) pairs.push(`passphrase=${phpUrlEncode(passphrase)}`);
  return pairs.join("&");
}

const md5 = s => crypto.createHash("md5").update(s).digest("hex");

function makePaymentId(prefix = "SCEND") {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${rand}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { amount = 5, mode } = req.body || {};

    // Decide env
    const SANDBOX = (process.env.PAYFAST_SANDBOX === "true") || mode === "sandbox";
    const merchant_id  = SANDBOX ? "10000100" : process.env.PAYFAST_MERCHANT_ID_LIVE;
    const merchant_key = SANDBOX ? "46f0cd694581a" : process.env.PAYFAST_MERCHANT_KEY_LIVE;
    if (!merchant_id || !merchant_key) return res.status(500).json({ error: "Merchant credentials are missing on server" });

    // Minimal, required fields only (plus merchant_key)
    const base = process.env.PUBLIC_BASE_URL || "https://www.scend.co.za";
    const postFields = {
      merchant_id,
      merchant_key,                          // POST & sign it
      return_url: `${base}/success`,
      cancel_url:  `${base}/cancel`,
      notify_url:  `${base}/api/payfast/itn`,
      amount: Number.parseFloat(amount).toFixed(2),
      item_name: "Test",                     // keep ultra-simple for this diagnostic
      m_payment_id: makePaymentId("SCEND"),  // unique reference
    };

    // Sandbox: DO NOT append passphrase. Live: append if set.
    const passphrase = (!SANDBOX && process.env.PAYFAST_PASSPHRASE) ? process.env.PAYFAST_PASSPHRASE : "";
    const sigString  = buildSigString(postFields, passphrase);
    const signature  = md5(sigString);

    const endpoint = SANDBOX
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    // Optional debug logs
    console.log("=== Payfast SIGN (minimal) ===");
    console.log("m_payment_id:", postFields.m_payment_id);
    console.log("sigString:", sigString);
    console.log("signature:", signature);
    console.log("==============================");

    return res.status(200).json({
      endpoint,
      post: { ...postFields, signature },
      debug: { SANDBOX, sigString }
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
