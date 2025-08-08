import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function PayPage() {
  const router = useRouter();
  const { tool } = router.query;
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) return; // wait for query params
    console.log("[/pay] router.isReady:", router.isReady, "tool:", tool);

    if (!tool || (tool !== "loan" && tool !== "tax")) {
      console.warn("[/pay] invalid or missing tool -> redirecting to /select-tool");
      router.push("/select-tool");
      return;
    }

    const run = async () => {
      try {
        // 1) Build fields
        const fields = {
          merchant_id: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID,
          merchant_key: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY,
          amount: "55.00",
          item_name: `Scend - ${tool === "loan" ? "Loan Tool" : "Tax Tool"} Access`,
          email_address: "motlatsi.lenyatsa@gmail.com",
          name_first: "Motlatsi",
          name_last: "Lenyatsa",
          return_url: `https://www.scend.co.za/${tool}`,
          cancel_url: `https://www.scend.co.za/select-tool`,
          notify_url: `https://www.scend.co.za/api/payfast/notify`,
        };
        console.log("[/pay] Prepared fields:", fields);

        // Sanity check: make sure public env vars exist
        if (!fields.merchant_id || !fields.merchant_key) {
          setError("Missing merchant credentials. Check Vercel env vars.");
          console.error("[/pay] Missing env vars:", {
            merchant_id: fields.merchant_id,
            merchant_key: fields.merchant_key,
          });
          return;
        }

        // 2) Ask server to sign
        const resp = await fetch("/api/payfast/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });

        if (!resp.ok) {
          const text = await resp.text();
          console.error("[/pay] Signature request failed:", text);
          setError("Payment initialisation failed. Please try again.");
          return;
        }

        const { signature } = await resp.json();
        console.log("[/pay] Signature from API:", signature);
        if (!signature) {
          setError("No signature returned from server.");
          return;
        }

        // 3) Build form + submit to PayFast LIVE
        const payload = { ...fields, signature };
        console.log("[/pay] PayFast payload to submit:", payload);

        const form = document.createElement("form");
        form.method = "POST";
        form.action = "https://www.payfast.co.za/eng/process"; // LIVE gateway

        Object.entries(payload).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } catch (e) {
        console.error("[/pay] Unexpected error:", e);
        setError("Unexpected error while starting payment.");
      }
    };

    run();
  }, [router.isReady, tool]); // re-run once query is ready

  if (error) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <h2>⚠ Payment Error</h2>
        <p>{error}</p>
        <p>Please try again or contact support.</p>
      </div>
    );
  }

  return <p>Redirecting to PayFast for secure R55.00 payment…</p>;
}
