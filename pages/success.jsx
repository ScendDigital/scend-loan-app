// pages/success.jsx
import { useEffect, useState } from "react";

export default function Success() {
  const [tool, setTool] = useState(null);
  const [status, setStatus] = useState("Setting up your access…");

  useEffect(() => {
    const url = new URL(window.location.href);
    const toolParam = url.searchParams.get("custom_str1") || "LoanTool";
    setTool(toolParam);

    fetch(`/api/session/create?tool=${encodeURIComponent(toolParam)}`, {
      method: "POST",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to start session");
        return res.json();
      })
      .then(() => {
        setStatus("✅ Access granted for 2 hours!");
      })
      .catch((err) => {
        console.error(err);
        setStatus(⚠️ Could not start your session. Please contact support.");
      });
  }, []);

  return (
    <main style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
      <h1>Payment Successful</h1>
      <p>{status}</p>

      {tool && status.startsWith("✅") && (
        <p style={{ marginTop: "1rem" }}>
          {tool === "LoanTool" && (
            <a href="/loan" style={{ color: "#d63384", fontWeight: "bold" }}>
              Go to Loan Tool →
            </a>
          )}
          {tool === "TaxTool" && (
            <a href="/tax" style={{ color: "#d63384", fontWeight: "bold" }}>
              Go to Tax Tool →
            </a>
          )}
        </p>
      )}

      <p style={{ marginTop: "2rem", fontSize: "0.9rem", opacity: 0.8 }}>
        Your session will expire automatically after 2 hours. You can always
        return to the payment page to purchase more time.
      </p>
    </main>
  );
}
