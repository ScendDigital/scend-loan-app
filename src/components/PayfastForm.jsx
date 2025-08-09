// src/components/PayfastForm.jsx
import { useState } from "react";

export default function PayfastForm({
  defaultAmount = 100,
  itemName = "Scend Tool Access (2 hours)",
  tool = "LoanTool",
  mode = "sandbox", // 'sandbox' or 'live'
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [endpoint, setEndpoint]   = useState("");
  const [postFields, setPostFields] = useState(null);
  const [debug, setDebug] = useState(null);

  const createSignature = async () => {
    setError("");
    setLoading(true);
    try {
      const resp = await fetch("/api/payfast/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: defaultAmount,
          item_name: itemName,
          item_description: `${tool} access for 2 hours`,
          custom_str1: tool,
          mode,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Failed to sign");
      setEndpoint(json.endpoint);
      setPostFields(json.post);
      setDebug(json.debug || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitToPayfast = () => {
    if (!postFields || !endpoint) return;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = endpoint;

    Object.entries(postFields).forEach(([k, v]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = String(v);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Mode: {mode === "sandbox" ? "Sandbox" : "Live"}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button disabled={loading} onClick={createSignature}>
          1) Generate signature
        </button>
        <button disabled={!postFields} onClick={submitToPayfast}>
          2) Continue to Payfast
        </button>
      </div>

      {postFields && (
        <div style={{ fontSize: 12, wordBreak: "break-all" }}>
          <div><b>Signature:</b> {postFields.signature}</div>
          <details style={{ marginTop: 8 }}>
            <summary>Fields being posted</summary>
            <pre style={{ padding: 8, background: "#f3f3f3", borderRadius: 6 }}>
{JSON.stringify(postFields, null, 2)}
            </pre>
          </details>
          {debug?.sigString && (
            <details style={{ marginTop: 8 }}>
              <summary>Signature string (server)</summary>
              <pre style={{ padding: 8, background: "#f9f9f9", borderRadius: 6 }}>
{debug.sigString}
              </pre>
            </details>
          )}
        </div>
      )}

      {error && <div style={{ color: "#c00", fontSize: 13 }}>{error}</div>}
    </div>
  );
}
