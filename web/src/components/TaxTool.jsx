// web/src/components/TaxTool.jsx
"use client";

import { useEffect, useState } from "react";
import { calculateAnnualPAYE } from "../lib/tax/calc";

const ZAR = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });
function num(v) { const n = parseFloat(String(v).replace(/[, ]/g, "")); return Number.isFinite(n) ? n : 0; }

export default function TaxTool() {
  // Mode & tax year
  const [taxYear, setTaxYear] = useState("2024/25");   // "2024/25" | "2025/26"
  const [mode, setMode] = useState("Annual");          // "Annual" | "Monthly"

  // Income & travel (annual inputs; monthly view derives from these)
  const [baseAnnualIncome, setBaseAnnualIncome] = useState("");
  const [travelAllowance, setTravelAllowance] = useState("");
  const [deem80, setDeem80] = useState(false);

  // Retirement & PAYE paid (annual)
  const [retirementAnnual, setRetirementAnnual] = useState("");
  const [payePaidAnnual, setPayePaidAnnual] = useState("");

  // Medical (SARS is month-based for credits)
  const [medDeps, setMedDeps] = useState("0");
  const [medPM, setMedPM] = useState("");
  const [months, setMonths] = useState("12");      // only needed for annual calc & AMTC
  const [medOOP, setMedOOP] = useState("");        // AMTC input (annual)

  // ID & disability (affects rebates/AMTC)
  const [idNum, setIdNum] = useState("");
  const [disabled, setDisabled] = useState(false);

  // Pro-rata (day-based)
  // Annual-only:
  const [partialYearByDays, setPartialYearByDays] = useState(false);
  const [yearDaysWorked, setYearDaysWorked] = useState(""); // e.g. 243 / 365
  // Monthly-only:
  const [prorataMonthByDays, setProrataMonthByDays] = useState(false);
  const [monthWorkedDays, setMonthWorkedDays] = useState("");     // e.g. 10
  const [monthDaysInPeriod, setMonthDaysInPeriod] = useState(""); // e.g. 22 or 30/31

  const [result, setResult] = useState(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Calculate using only the flags relevant to the current mode
  const onCalculate = () => {
    const annualFlags =
      mode === "Annual"
        ? { partialYearByDays, yearDaysWorked: num(yearDaysWorked) || 0 }
        : { partialYearByDays: false, yearDaysWorked: 0 };

    const monthlyFlags =
      mode === "Monthly"
        ? {
            prorataMonthByDays,
            monthWorkedDays: num(monthWorkedDays) || 0,
            monthDaysInPeriod: num(monthDaysInPeriod) || 0,
          }
        : { prorataMonthByDays: false, monthWorkedDays: 0, monthDaysInPeriod: 0 };

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
      ...annualFlags,
      ...monthlyFlags,
    });

    // Balance only meaningful in Annual mode
    const balance = res.taxAfterCredits - (mode === "Annual" ? num(payePaidAnnual) : 0);
    setResult({ ...res, balance });
    setHasCalculated(true);
  };

  // Auto-recalculate when switching modes (after first Calculate)
  useEffect(() => {
    if (hasCalculated) onCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const onClear = () => {
    setTaxYear("2024/25");
    setMode("Annual");
    setBaseAnnualIncome("");
    setTravelAllowance("");
    setDeem80(false);
    setRetirementAnnual("");
    setPayePaidAnnual("");
    setMedDeps("0");
    setMedPM("");
    setMonths("12");
    setMedOOP("");
    setIdNum("");
    setDisabled(false);
    setPartialYearByDays(false);
    setYearDaysWorked("");
    setProrataMonthByDays(false);
    setMonthWorkedDays("");
    setMonthDaysInPeriod("");
    setResult(null);
    setHasCalculated(false);
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

      {/* Income & Travel (always needed because monthly derives from annual inputs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">
            {mode === "Annual" ? "Base Annual Income (excl. travel)" : "Base Annual Income (annual figure)"}
          </div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 870057.68" value={baseAnnualIncome} onChange={(e) => setBaseAnnualIncome(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">
            {mode === "Annual" ? "Travel Allowance (annual)" : "Travel Allowance (annual figure)"}
          </div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 60000" value={travelAllowance} onChange={(e) => setTravelAllowance(e.target.value)} />
        </label>
      </div>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={deem80} onChange={(e) => setDeem80(e.target.checked)} />
        <span>Employer deems ≥80% business use (20% taxable for PAYE)</span>
      </label>

      {/* Retirement (annual) & PAYE paid (annual-only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Retirement Contributions (annual)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 107898" value={retirementAnnual} onChange={(e) => setRetirementAnnual(e.target.value)} />
        </label>

        {mode === "Annual" && (
          <label className="block">
            <div className="text-sm font-medium mb-1">Tax paid already (annual PAYE)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 184996.28" value={payePaidAnnual} onChange={(e) => setPayePaidAnnual(e.target.value)} />
          </label>
        )}
      </div>

      {/* Medical: in Monthly mode, only monthly MTC matters (hide months & OOP) */}
      <div className={`grid ${mode === "Annual" ? "grid-cols-1 md:grid-cols-4" : "grid-cols-1 md:grid-cols-2"} gap-4`}>
        <label className="block">
          <div className="text-sm font-medium mb-1">Medical Dependants (incl. main)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 3" value={medDeps} onChange={(e) => setMedDeps(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Medical Scheme Contribution (per month)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 3500" value={medPM} onChange={(e) => setMedPM(e.target.value)} />
        </label>

        {mode === "Annual" && (
          <>
            <label className="block">
              <div className="text-sm font-medium mb-1">Months Covered (1–12)</div>
              <input className="border rounded p-2 w-full" placeholder="12" value={months} onChange={(e) => setMonths(e.target.value)} />
            </label>

            <label className="block">
              <div className="text-sm font-medium mb-1">Medical Out-of-Pocket (annual)</div>
              <input className="border rounded p-2 w-full" placeholder="e.g. 12000" value={medOOP} onChange={(e) => setMedOOP(e.target.value)} />
            </label>
          </>
        )}
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

      {/* Pro-rata controls – shown per mode */}
      {mode === "Annual" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={partialYearByDays} onChange={(e) => setPartialYearByDays(e.target.checked)} />
            <span>Partial tax year (pro-rata by <strong>days</strong>)</span>
          </label>

          {partialYearByDays && (
            <label className="block">
              <div className="text-sm font-medium mb-1">Days employed in this tax year</div>
              <input className="border rounded p-2 w-full" placeholder="e.g. 243" value={yearDaysWorked} onChange={(e) => setYearDaysWorked(e.target.value)} />
            </label>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={prorataMonthByDays} onChange={(e) => setProrataMonthByDays(e.target.checked)} />
            <span>Pro-rata this month (by <strong>days</strong>)</span>
          </label>

          {prorataMonthByDays && (
            <>
              <label className="block">
                <div className="text-sm font-medium mb-1">Days worked this month</div>
                <input className="border rounded p-2 w-full" placeholder="e.g. 10" value={monthWorkedDays} onChange={(e) => setMonthWorkedDays(e.target.value)} />
              </label>
              <label className="block">
                <div className="text-sm font-medium mb-1">Days in month/period</div>
                <input className="border rounded p-2 w-full" placeholder="e.g. 22 or 30" value={monthDaysInPeriod} onChange={(e) => setMonthDaysInPeriod(e.target.value)} />
              </label>
            </>
          )}
        </div>
      )}

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
            {mode === "Annual" ? `Breakdown (${result.taxYear}) • Annual` : `Breakdown (${result.taxYear}) • Monthly`}
          </div>

          {/* ID/Rebate note */}
          {!result.idProvided && result.rebateNote && (
            <div className="mb-3 p-2 rounded bg-yellow-50 text-yellow-900 text-sm">
              {result.rebateNote}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            <div>Age (from ID): <strong>{result.idProvided ? result.age : "—"}</strong></div>
            <div>Months covered: <strong>{result.monthsCovered}</strong></div>

            {mode === "Annual" ? (
              <>
                <div>Remuneration (annual): <strong>{ZAR.format(result.remunerationAnnual)}</strong></div>
                <div>Taxable income: <strong>{ZAR.format(result.taxableIncome)}</strong></div>
                <div>Annual tax (before rebates): <strong>{ZAR.format(result.taxBeforeRebates)}</strong></div>
                <div>Rebates applied: <strong>{ZAR.format(result.rebates)}</strong></div>
                <div>After rebates (annual): <strong>{ZAR.format(result.taxAfterRebates)}</strong></div>
                <div>MTC (monthly): <strong>{ZAR.format(result.mtcMonthly)}</strong></div>
                <div>MTC total (annual @ months): <strong>{ZAR.format(result.mtcAnnual)}</strong></div>
                <div>AMTC (annual): <strong>{ZAR.format(result.amtc)}</strong></div>
                <div>Annual tax after credits: <strong>{ZAR.format(result.taxAfterCredits)}</strong></div>
                {partialYearByDays && (
                  <div>
                    Annual tax (pro-rated by days × {result.annualProrationFactorDays.toFixed(3)}):{" "}
                    <strong>{ZAR.format(result.annualTaxProratedDays)}</strong>
                  </div>
                )}
                <div>Balance vs PAYE paid: <strong>{ZAR.format(result.balance)}</strong></div>
              </>
            ) : (
              <>
                <div>Remuneration (PAYE basis): <strong>{ZAR.format(result.remunerationPAYE)}</strong></div>
                <div>Monthly PAYE (approx): <strong>{ZAR.format(result.monthlyPAYEApprox)}</strong></div>
                {prorataMonthByDays && (
                  <div>
                    Pro-rata this month ({(result.monthProrationPctDays * 100).toFixed(0)}%):{" "}
                    <strong>{ZAR.format(result.monthlyPAYEProrataDays)}</strong>
                  </div>
                )}
                <div>MTC (monthly): <strong>{ZAR.format(result.mtcMonthly)}</strong></div>
              </>
            )}
          </div>

          <div className="mt-3 text-sm text-gray-600">
            {mode === "Annual"
              ? "Notes: Annual view uses full-year figures. Annual pro-rata (if selected) scales the final annual tax by your employed days in the tax year. Medical credits follow SARS monthly rules."
              : "Notes: Monthly view shows PAYE derived from annual assessment divided by 12. Monthly pro-rata (if selected) scales this month's PAYE by worked-days / period-days. Medical credits are applied per month (AMTC is annual, not shown here)."}
          </div>
        </div>
      )}
    </div>
  );
}
