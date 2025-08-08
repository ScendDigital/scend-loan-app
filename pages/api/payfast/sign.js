// pages/api/payfast/sign.js
import crypto from "crypto";

function buildSignatureString(fields, passphrase) {
  // 1) sort keys alphabetically
  const ordered = Object.keys(fields)
    .sort()
    .reduce((acc, k) => {
      const v = fields[k];
      // Payfast: exclude empty/null/undefined
      if (v !== null && v !== undefined && String(v).length > 0) {
        acc[k] = String(v);
      }
      return acc;
    }, {});

  // 2) stringify as key=value&key2=value2...
  const pairs = Object.entries(ordered).map(
    ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v).replace(/%20/g, "+")}`
  );
  if (passphrase) {
    pairs.push(`passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`);
  }
  return pairs.join("&");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const fields = req.body || {};
    // Optional: sanity checks
    const required = ["merchant_id", "merchant_key", "amount", "item_name", "m_payment_id"];
    const missing = required.filter((k) => !fields[k]);
    if (missing.length) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    }

    const passphrase = process.env.PAYFAST_PASSPHRASE || ""; // leave blank if not set in dashboard
    const signatureString = buildSignatureString(fields, passphrase);
    const signature = crypto.createHash("md5").update(signatureString).digest("hex");

    // Helpful debug (shows in Vercel logs, redact email)
    console.log("✅ Generated Signature:", signature);
    return res.status(200).json({ signature });
  } catch (err) {
    console.error("Signature error:", err);
    return res.status(500).json({ error: "Signature generation failed" });
  }
}
