import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const data = req.body || {};

    // Retrieve your PayFast passphrase from environment variables
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    if (!passphrase) {
      console.error("❌ Missing PAYFAST_PASSPHRASE in environment variables");
      return res.status(500).json({ error: "Server missing passphrase" });
    }

    // Sort fields alphabetically as required by PayFast
    const sortedKeys = Object.keys(data).sort();
    const queryString = sortedKeys
      .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
      .join("&");

    // Append passphrase
    const stringToSign = `${queryString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`;

    // Debug log: what we are signing
    console.log("🔍 PayFast Signing Debug");
    console.log("Fields Received:", data);
    console.log("Sorted Keys:", sortedKeys);
    console.log("Query String (before signing):", queryString);
    console.log("String To Sign (with passphrase):", stringToSign);

    // Create MD5 signature
    const signature = crypto.createHash("md5").update(stringToSign).digest("hex");

    console.log("✅ Generated Signature:", signature);

    return res.status(200).json({ signature });
  } catch (err) {
    console.error("💥 Error in PayFast signing API:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
