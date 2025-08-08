// pages/api/payfast/sign.js
import crypto from "crypto";

export default function handler(req, res) {
  // Debug GET so we can hit it in browser
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      message: "PayFast sign.js API is live 🚀",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    if (!passphrase) {
      console.error("❌ Missing PAYFAST_PASSPHRASE");
      return res.status(500).json({ error: "Server missing passphrase" });
    }

    const fields = req.body || {};

    // 🔑 SORT KEYS ALPHABETICALLY (required by PayFast)
    const sortedKeys = Object.keys(fields).sort();

    // Build key=value&key=value with URL-encoding and spaces as '+'
    const queryString = sortedKeys
      .map((key) => `${key}=${encodeURIComponent(String(fields[key])).replace(/%20/g, "+")}`)
      .join("&");

    // Append passphrase (also URL-encode; spaces as '+')
    const stringToSign =
      queryString + `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`;

    // MD5 hash per PayFast docs
    const signature = crypto.createHash("md5").update(stringToSign).digest("hex");

    // Debug logs
    console.log("🔍 PayFast Signing Debug");
    console.log("Fields Received:", fields);
    console.log("Sorted Keys:", sortedKeys);
    console.log("Query String:", queryString);
    console.log("String To Sign:", stringToSign);
    console.log("✅ Generated Signature:", signature);

    return res.status(200).json({ signature });
  } catch (err) {
    console.error("💥 Error in sign.js:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
