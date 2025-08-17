"use client";

import dynamic from "next/dynamic";

const LoanTool = dynamic(() => import("../../components/LoanTool"), {
  ssr: false,
  loading: () => <div className="p-6">Loading Loan Tool…</div>,
});

export default function LoanToolClient() {
  return <LoanTool />;
}
