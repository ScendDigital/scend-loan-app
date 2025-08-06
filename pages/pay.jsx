import { useEffect } from "react";
import { useRouter } from "next/router";

export default function PayPage() {
  const router = useRouter();
  const { tool } = router.query;

  useEffect(() => {
    if (!tool || (tool !== "loan" && tool !== "tax")) {
      router.push("/select-tool");
      return;
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://sandbox.payfast.co.za/eng/process" // sandbox URL for testing

    const fields = {
  merchant_id: "10000100",          // replace with sandbox ID
  merchant_key: "sandbox-key-here", // replace with sandbox key
  amount: "55.00",
  item_name: "Scend – Loan Tool Access",
  return_url: `${window.location.origin}/loan`,
  cancel_url: `${window.location.origin}/select-tool`,
  notify_url: `${window.location.origin}/api/payfast/notify`,
};

    for (const key in fields) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = fields[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }, [tool]);

  return <p>Redirecting to Payfast for secure R55.00 payment...</p>;
}
