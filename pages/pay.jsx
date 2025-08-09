// pages/pay.jsx
import dynamic from "next/dynamic";
const PayfastForm = dynamic(() => import("../src/components/PayfastForm"), { ssr: false });

export default function Pay() {
  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
      <h1>Payfast Sandbox Test</h1>
      <p>Use this page to test Payfast payment flow in sandbox mode. Once working,
        we can embed this into LoanTool or TaxTool.</p>
      <PayfastForm mode="sandbox" tool="LoanTool" defaultAmount={5} />
    </div>
  );
}
