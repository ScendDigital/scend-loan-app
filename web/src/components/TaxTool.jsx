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

  // Income & travel (user input)
  // In Monthly mode these are PER MONTH; in Annual mode they are ANNUAL
  const [baseIncomeInput, setBaseIncomeInput] = useState("");
  const [travelInput, setTravelInput] = useState("");
  const [deem80, setDeem80] = useState(false);

  // Retirement (user input)
  // In Monthly mode this is PER MONTH; in Annual mode it's ANNUAL
  const [retirementInput, setRetirementInput] = useState("");

  // PAYE paid (only Annual mode compares to annual PAYE already paid)
  const [payePaidAnnual, setPayePaidAnnual] = useState("");

  // Medical (SARS is month-based for credits)
  const [medDeps, setMedDeps] = useState("0");
  const [medPM, setMedPM] = useState("");     // per month, both modes
  const [months, setMonths] = useState("12"); // only used in Annual mode (AMTC)
  const [medOOP, setMedOOP] = useState("");   // annual, only Annual mode

  // ID & disability
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

  const onCalculate = () => {
    // Annualise inputs if we're in Monthly mode
    const baseAnnual = mode === "Monthly" ? num(baseIncomeInput) * 12 : num(baseIncomeInput);
    const travelAnnual = mode === "Monthly" ? num(travelInput) * 12 : num(travelInput);
    const retireAnnual = mode === "Monthly" ? num(retirementInput) * 12 : num(retirementInput);

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
      baseAnnualIncome: baseAnnual,                 // always ANNUAL to the calc
      travelAllowanceAnnual: travelAnnual,          // always ANNUAL to the calc
      deem80BusinessUse: deem80,
      retirementContribAnnual: retireAnnual,        // always ANNUAL to the calc

      medDependants: Math.max(0, Math.floor(num(medDeps))),
      medContributionMonthly: num(medPM),           // monthly in both modes

      // For Monthly mode we don't need months/OOP for the baseline; pass 12 so MTC annualises cleanly.
      monthsCovered: mode === "Annual" ? Math.max(0, Math.min(12, Math.floor(num(months)))) : 12,
      medOutOfPocketAnnual: mode === "Annual" ? num(medOOP) : 0,

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
    setBaseIncomeInput("");
    setTravelInput("");
    setDeem80(false);
    setRetirementInput("");
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

      {/* Income & Travel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">
            {mode === "Annual" ? "Base Annual Income (excl. travel)" : "Base Income (per month, excl. travel)"}
          </div>
          <input
            className="border rounded p-2 w-full"
            placeholder={mode === "Annual" ? "e.g. 870057.68" : "e.g. 72504.81"}
            value={baseIncomeInput}
            onChange={(e) => setBaseIncomeInput(e.target.value)}
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">
            {mode === "Annual" ? "Travel Allowance (annual)" : "Travel Allowance (per month)"}
          </div>
          <input
            className="border rounded p-2 w-full"
            placeholder={mode === "Annual" ? "e.g. 60000" : "e.g. 5000"}
            value={travelInput}
            onChange={(e) => setTravelInput(e.target.value)}
          />
        </label>
      </div>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={deem80} onChange={(e) => setDeem80(e.target.checked)} />
        <span>Employer deems ≥80% business use (20% taxable for PAYE)</span>
      </label>

      {/* Retirement & PAYE paid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">
            {mode === "Annual" ? "Retirement Contributions (annual)" : "Retirement Contributions (per month)"}
          </div>
          <input
            className="border rounded p-2 w-full"
            placeholder={mode === "Annual" ? "e.g. 107898" : "e.g. 8992"}
            value={retirementInput}
            onChange={(e) => setRetirementInput(e.target.value)}
          />
        </label>

        {mode === "Annual" && (
          <label className="block">
            <div className="text-sm font-medium mb-1">Tax paid already (annual PAYE)</div>
            <input
              className="border rounded p-2 w-full"
              placeholder="e.g. 184996.28"
              value={payePaidAnnual}
              onChange={(e) => setPayePaidAnnual(e.target.value)}
            />
          </label>
        )}
      </div>

      {/* Medical */}
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

      {/* Pro-rata controls – per mode */}
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
                <div>Monthly PAYE (approx, no AMTC): <strong>{ZAR.format(result.monthlyPAYE_without_AMTC)}</strong></div>
                {prorataMonthByDays && (
                  <div>
                    Pro-rata this month ({(result.monthProrationPctDays * 100).toFixed(0)}%):{" "}
                    <strong>{ZAR.format(result.monthlyPAYEProrataDaysNoAMTC)}</strong>
                  </div>
                )}
                <div>MTC (monthly): <strong>{ZAR.format(result.mtcMonthly)}</strong></div>
              </>
            )}
          </div>

          <div className="mt-3 text-sm text-gray-600">
            {mode === "Annual"
              ? "Notes: Annual view uses full-year figures. Annual pro-rata (if selected) scales the final annual tax by your employed days in the tax year. Medical credits follow SARS monthly rules."
              : "Notes: Monthly view accepts per-month figures and annualises them under the hood. Monthly PAYE excludes AMTC (assessment-only) and includes the monthly MTC. Day-based pro-rata scales this month’s PAYE by worked-days/period-days."}
          </div>
        </div>
      )}
    </div>
  );
}
