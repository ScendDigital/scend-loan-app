"use client";
import dynamic from "next/dynamic";

const TaxTool = dynamic(() => import("../../components/TaxTool"), {
  ssr: false,
  loading: () => <div>Loading Tax Tool…</div>,
});

export default function TaxToolClient() {
  return <TaxTool />;
}
