// web/src/components/TaxTool.jsx
"use client";

import { useState } from "react";
import { calculateAnnualPAYE } from "../lib/tax/calc";

const ZAR = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });
function num(v) { const n = parseFloat(String(v).replace(/[, ]/g, "")); return Number.isFinite(n) ? n : 0; }

export default function TaxTool() {
  // Selectors
  const [taxYear, setTaxYear] = useState("2024/25");     // "2024/25" | "2025/26"
  const [mode, setMode] = useState("Annual");            // "Annual" | "Monthly"

  // Income & travel
  const [baseAnnualIncome, setBaseAnnualIncome] = useState("");
  const [travelAllowance, setTravelAllowance] = useState("");
  const [deem80, setDeem80] = useState(false);

  // Retirement & PAYE paid
  const [retirementAnnual, setRetirementAnnual] = useState("");
  const [payePaid, setPayePaid] = useState("");

  // Medical
  const [medDeps, setMedDeps] = useState("0");
  const [medPM, setMedPM] = useState("");
  const [months, setMonths] = useState("12");
  const [medOOP, setMedOOP] = useState("");

  // ID & disability
  const [idNum, setIdNum] = useState("");
  const [disabled, setDisabled] = useState(false);

  // Pro-rata flags/inputs
  const [partialYear, setPartialYear] = useState(false);        // Annual pro-rata (months/12)
  const [monthProrataPct, setMonthProrataPct] = useState("100"); // Monthly pro-rata %

  const [result, setResult] = useState(null);

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

      // pro-rata options
      partialYear,
      monthProrataPct: num(monthProrataPct),
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
    setPartialYear(false);
    setMonthProrataPct("100");
    setResult(null);
  };

  const onExportPDF = () => { window.print(); };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Scend • SARS PAYE</h1>

      {/* Year & Mode */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Tax Year</div>
          <select className="border rounded p-2 w-full" value={taxYear} onChange={(e) => setTaxYear(e.target.value)}>
            <option value="2024/25">2024/25</option>
            <option value="2025/26">2025/26</option>
          </select>
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Mode</div>
          <select className="border rounded p-2 w-full" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option>Annual</option>
            <option>Monthly</option>
          </select>
        </label>
      </div>

      {/* Income & travel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Base Annual Income (excl. travel)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 870057.68" value={baseAnnualIncome} onChange={(e) => setBaseAnnualIncome(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Travel Allowance (annual)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 60000" value={travelAllowance} onChange={(e) => setTravelAllowance(e.target.value)} />
        </label>
      </div>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={deem80} onChange={(e) => setDeem80(e.target.checked)} />
        <span>Employer deems ≥80% business use (20% taxable for PAYE)</span>
      </label>

      {/* Retirement & PAYE paid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Retirement Contributions (annual)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 107898" value={retirementAnnual} onChange={(e) => setRetirementAnnual(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Tax paid already (annual PAYE)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 184996.28" value={payePaid} onChange={(e) => setPayePaid(e.target.value)} />
        </label>
      </div>

      {/* Medical */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Medical Dependants (incl. main)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 3" value={medDeps} onChange={(e) => setMedDeps(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Medical Scheme Contribution (per month)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 3500" value={medPM} onChange={(e) => setMedPM(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Months Covered (1–12)</div>
          <input className="border rounded p-2 w-full" placeholder="12" value={months} onChange={(e) => setMonths(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Medical Out-of-Pocket (annual)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 12000" value={medOOP} onChange={(e) => setMedOOP(e.target.value)} />
        </label>
      </div>

      {/* ID & disability */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block md:col-span-2">
          <div className="text-sm font-medium mb-1">ID Number (for age rebates)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 8409196012087" value={idNum} onChange={(e) => setIdNum(e.target.value)} />
        </label>

        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
          <span>Disability (you/spouse/child)</span>
        </label>
      </div>

      {/* Pro-rata options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={partialYear} onChange={(e) => setPartialYear(e.target.checked)} />
          <span>Partial tax year (Annual pro-rata by months/12)</span>
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Pro-rata this month (PAYE) %</div>
          <input className="border rounded p-2 w-full" placeholder="100" value={monthProrataPct} onChange={(e) => setMonthProrataPct(e.target.value)} />
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="px-4 py-2 rounded bg-black text-white" onClick={onCalculate}>Calculate</button>
        <button className="px-4 py-2 rounded border" onClick={onExportPDF}>Export PDF</button>
        <button className="px-4 py-2 rounded border" onClick={onClear}>Clear</button>
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
                {partialYear && (
                  <div>Remuneration (annual, pro-rated): <strong>{ZAR.format(result.remunerationAnnualProrated)}</strong></div>
                )}
                <div>Taxable income: <strong>{ZAR.format(result.taxableIncome)}</strong></div>
                <div>Annual tax (before rebates): <strong>{ZAR.format(result.taxBeforeRebates)}</strong></div>
                <div>Age rebates (total): <strong>{ZAR.format(result.rebates)}</strong></div>
                <div>After rebates (annual): <strong>{ZAR.format(result.taxAfterRebates)}</strong></div>
                <div>MTC (monthly): <strong>{ZAR.format(result.mtcMonthly)}</strong></div>
                <div>MTC total (annual @ months): <strong>{ZAR.format(result.mtcAnnual)}</strong></div>
                <div>AMTC (annual): <strong>{ZAR.format(result.amtc)}</strong></div>
                <div>Annual tax after credits: <strong>{ZAR.format(result.taxAfterCredits)}</strong></div>
                {partialYear && (
                  <div>Annual tax (pro-rated × {result.annualProrationFactor.toFixed(3)}): <strong>{ZAR.format(result.annualTaxProrated)}</strong></div>
                )}
                <div>Balance vs PAYE paid: <strong>{ZAR.format(result.balance)}</strong></div>
              </>
            ) : (
              <>
                <div>Remuneration (PAYE basis): <strong>{ZAR.format(result.remunerationPAYE)}</strong></div>
                <div>Monthly PAYE (approx): <strong>{ZAR.format(result.monthlyPAYEApprox)}</strong></div>
                <div>Pro-rata this month ({result.monthProrationPct.toFixed(0)}%): <strong>{ZAR.format(result.monthlyPAYEProrata)}</strong></div>
                <div>MTC (monthly): <strong>{ZAR.format(result.mtcMonthly)}</strong></div>
                <div>MTC (annual @ months): <strong>{ZAR.format(result.mtcAnnual)}</strong></div>
              </>
            )}
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Notes: Travel allowance included at {deem80 ? "20%" : "80%"} for PAYE. Retirement deduction cap = min(RA, 27.5% of remuneration, R350,000).
            Annual pro-rata applies by months/12 when selected; monthly pro-rata applies by the entered % for this month.
          </div>
        </div>
      )}
    </div>
  );
}
