import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function PayPage() {
  const router = useRouter();
  const { tool } = router.query;
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tool || (tool !== "loan" && tool !== "tax")) {
      router.push("/select-tool");
      return;
    }

    const run = async () => {
      try {
        const fields = {
          merchant_id: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID,
          merchant_key: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY,
          amount: "55.00",
          item_name: `Scend - ${tool === "loan" ? "Loan Tool" : "Tax Tool"} Access`,
          email_address: "motlatsi.lenyatsa@gmail.com",
          return_url: `https://www.scend.co.za/${tool}`,
          cancel_url: `https://www.scend.co.za/select-tool`,
          notify_url: `https://www.scend.co.za/api/payfast/notify`,
        };

        // Get signature from server
        const resp = await fetch("/api/payfast/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });

        if (!resp.ok) {
          const text = await resp.text();
          console.error("Signature request failed:", text);
          setError(`Payment initialisation failed: ${text}`);
          return;
        }

        const { signature } = await resp.json();
        if (!signature) {
          setError("No signature returned from server.");
          return;
        }

        // Create form and submit to PayFast
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "https://www.payfast.co.za/eng/process";

        const payload = { ...fields, signature };
        Object.entries(payload).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Unexpected error occurred while starting payment.");
      }
    };

    run();
  }, [tool, router]);

  if (error) {
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        <h2>⚠ Payment Error</h2>
        <p>{error}</p>
        <p>Please try again later or contact support.</p>
      </div>
    );
  }

  return <p>Redirecting to Payfast for secure R55.00 payment...</p>;
}
