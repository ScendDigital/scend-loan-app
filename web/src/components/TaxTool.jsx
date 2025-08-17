// web/src/components/TaxTool.jsx
"use client";

import { useState } from "react";
import { calculateAnnualPAYE } from "../lib/tax/calc"; // relative to /components

const ZAR = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });

function num(v) {
  const n = parseFloat(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function TaxTool() {
  // --- Inputs / state ---
  const [taxYear, setTaxYear] = useState("2024/25");              // "2024/25" | "2025/26"
  const [mode, setMode] = useState("Annual");                     // "Annual" | "Monthly"

  const [baseAnnualIncome, setBaseAnnualIncome] = useState("");   // excl travel
  const [travelAllowance, setTravelAllowance] = useState("");     // annual
  const [deem80, setDeem80] = useState(false);                    // true => 20% PAYE inclusion

  const [retirementAnnual, setRetirementAnnual] = useState("");
  const [payePaid, setPayePaid] = useState("");

  const [medDeps, setMedDeps] = useState("0");                    // incl main
  const [medPM, setMedPM] = useState("");                         // per month
  const [months, setMonths] = useState("12");
  const [medOOP, setMedOOP] = useState("");

  const [idNum, setIdNum] = useState("");
  const [disabled, setDisabled] = useState(false);

  const [result, setResult] = useState(null);

  // --- Actions ---
  const onCalculate = () => {
    const res = calculateAnnualPAYE({
      taxYear,
      baseAnnualIncome: num(baseAnnualIncome),
      travelAllowanceAnnual: num(travelAllowance),
      deem80BusinessUse: deem80,
      retirementContribAnnual: num(retirementAnnual),
      medDependants: Math.max(0, Math.floor(num(medDeps))),
      medContributionMonthly: num(medPM),
      monthsCovered: Math.max(0, Math.min(12, Math.floor(num(months)))),
      medOutOfPocketAnnual: num(medOOP),
      idNumber: idNum,
      disabled,
    });
    const balance = res.taxAfterCredits - num(payePaid);
    setResult({ ...res, balance });
  };

  const onClear = () => {
    setTaxYear("2024/25");
    setMode("Annual");
    setBaseAnnualIncome("");
    setTravelAllowance("");
    setDeem80(false);
    setRetirementAnnual("");
    setPayePaid("");
    setMedDeps("0");
    setMedPM("");
    setMonths("12");
    setMedOOP("");
    setIdNum("");
    setDisabled(false);
    setResult(null);
  };

  const onExportPDF = () => {
    // Simple print for now (avoids extra deps). Swap with jsPDF if you prefer.
    window.print();
  };

  // --- UI ---
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Scend • SARS PAYE</h1>

      {/* Top selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Tax Year</div>
          <select
            className="border rounded p-2 w-full"
            value={taxYear}
            onChange={(e) => setTaxYear(e.target.value)}
          >
            <option value="2024/25">2024/25</option>
            <option value="2025/26">2025/26</option>
          </select>
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Mode</div>
          <select
            className="border rounded p-2 w-full"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option>Annual</option>
            <option>Monthly</option>
          </select>
        </label>
      </div>

      {/* Income & travel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Base Annual Income (excl. travel)</div>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. 870057.68"
            value={baseAnnualIncome}
            onChange={(e) => setBaseAnnualIncome(e.target.value)}
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Travel Allowance (annual)</div>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. 60000"
            value={travelAllowance}
            onChange={(e) => setTravelAllowance(e.target.value)}
          />
        </label>
      </div>

      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={deem80}
          onChange={(e) => setDeem80(e.target.checked)}
        />
        <span>Employer deems ≥80% business use (20% taxable for PAYE)</span>
      </label>

      {/* Retirement & PAYE paid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Retirement Contributions (annual)</div>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. 107898"
            value={retirementAnnual}
            onChange={(e) => setRetirementAnnual(e.target.value)}
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Tax paid already (annual PAYE)</div>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. 184996.28"
            value={payePaid}
            onChange={(e) => setPayePaid(e.target.value)}
          />
        </label>
      </div>

      {/* Medical */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Medical Dependants (incl. main)</div>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. 3"
            value={medDeps}
            onChange={(e) => setMedDeps(e.target.value)}
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Medical Scheme Contribution (per month)</div>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. 3500"
            value={medPM}
            onChange={(e) => setMedPM(e.target.value)}
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Months Covered (1–12)</div>
          <input
            className="border rounded p-2 w-full"
            placeholder="12"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Medical Out-of-Pocket (annual)</div>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. 12000"
            value={medOOP}
            onChange={(e) => setMedOOP(e.target.value)}
          />
        </label>
      </div>

      {/* ID & disability */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block md:col-span-2">
          <div className="text-sm font-medium mb-1">ID Number (for age rebates)</div>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. 8409196012087"
            value={idNum}
            onChange={(e) => setIdNum(e.target.value)}
          />
        </label>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
          />
          <span>Disability (you/spouse/child)</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="px-4 py-2 rounded bg-black text-white" onClick={onCalculate}>
          Calculate
        </button>
        <button className="px-4 py-2 rounded border" onClick={onExportPDF}>
          Export PDF
        </button>
        <button className="px-4 py-2 rounded border" onClick={onClear}>
          Clear
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-6 border rounded p-4">
          <div className="text-lg font-semibold mb-2">
            Breakdown ({result.taxYear}) • {mode}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            <div>Age (from ID): <strong>{result.age}</strong></div>
            <div>Months covered: <strong>{result.monthsCovered}</strong></div>

            {mode === "Annual" ? (
              <>
                <div>Remuneration (annual): <strong>{ZAR.format(result.remunerationAnnual)}</strong></div>
                <div>Taxable income: <strong>{ZAR.format(result.taxableIncome)}</strong></div>
                <div>Annual tax (before rebates): <strong>{ZAR.format(result.taxBeforeRebates)}</strong></div>
                <div>Age rebates (total): <strong>{ZAR.format(result.rebates)}</strong></div>
                <div>After rebates (annual): <strong>{ZAR.format(result.taxAfterRebates)}</strong></div>
                <div>MTC (monthly): <strong>{ZAR.format(result.mtcMonthly)}</strong></div>
                <div>MTC total (annual): <strong>{ZAR.format(result.mtcAnnual)}</strong></div>
                <div>AMTC (annual): <strong>{ZAR.format(result.amtc)}</strong></div>
                <div>Annual tax after credits: <strong>{ZAR.format(result.taxAfterCredits)}</strong></div>
                <div>Balance due / (refund) vs PAYE already paid: <strong>{ZAR.format(result.balance)}</strong></div>
              </>
            ) : (
              <>
                <div>Remuneration (PAYE basis): <strong>{ZAR.format(result.remunerationPAYE)}</strong></div>
                <div>Monthly PAYE (approx): <strong>{ZAR.format(result.monthlyPAYEApprox)}</strong></div>
                <div>MTC (monthly): <strong>{ZAR.format(result.mtcMonthly)}</strong></div>
                <div>MTC (annual @ months): <strong>{ZAR.format(result.mtcAnnual)}</strong></div>
              </>
            )}
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Notes: Travel allowance included at {deem80 ? "20%" : "80%"} for PAYE. Retirement deduction cap = min(RA, 27.5% of remuneration, R350,000).
            Apply official SARS 2024/25 tables; unchanged for 2025/26. Update numbers when SARS publishes changes.
          </div>
        </div>
      )}
    </div>
  );
}
