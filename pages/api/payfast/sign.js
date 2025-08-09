// pages/api/payfast/sign.js
import crypto from "crypto";

// Build Payfast signature string from NON-EMPTY fields (no signature, no merchant_key)
function buildSignatureString(fields, passphrase) {
  const pairs = [];
  Object.keys(fields)
    .filter((k) => k !== "signature" && k !== "merchant_key")
    .sort()
    .forEach((k) => {
      const v = fields[k];
      if (v === undefined || v === null) return;
      const sv = String(v);
      if (!sv.length) return;
      const ek = encodeURIComponent(k);
      const ev = encodeURIComponent(sv).replace(/%20/g, "+");
      pairs.push(`${ek}=${ev}`);
    });

  if (passphrase) {
    pairs.push(
      `passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`
    );
  }
  return pairs.join("&");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const fields = req.body || {};

    // Required fields Payfast expects in the form (merchant_key is NOT one of them)
    const required = ["merchant_id", "amount", "item_name", "m_payment_id"];
    const missing = required.filter((k) => !fields[k]);
    if (missing.length) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    }

    // Normalise/validate amount format
    const amt = String(fields.amount);
    if (!/^\d+(\.\d{2})$/.test(amt)) {
      return res.status(400).json({ error: `Amount must be two decimals, got: ${amt}` });
    }

    // If your LIVE dashboard has no passphrase, leave env empty/undefined
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";

    const signatureString = buildSignatureString(fields, passphrase);
    const signature = crypto.createHash("md5").update(signatureString).digest("hex");

    const body = { signature };
    if (process.env.PF_DEBUG === "1") {
      body._debug = { signatureString, fieldsEcho: fields };
    }
    return res.status(200).json(body);
  } catch (e) {
    console.error("Signature error:", e);
    return res.status(500).json({ error: "Signature generation failed" });
  }
}
