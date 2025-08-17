// web/src/components/LoanTool.jsx
"use client";

import { useMemo, useState } from "react";

const ZAR = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });
const pct = (n) => `${(n * 100).toFixed(2)}%`;

function cleanNum(v) {
  const n = parseFloat(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// Payment with future value (balloon) support
// pv: principal, r: monthly rate, n: months, fv: balance remaining at term
function pmtWithFV(pv, r, n, fv = 0) {
  if (n <= 0) return 0;
  if (r === 0) return (pv - fv) / n;
  const discFV = fv / Math.pow(1 + r, n);
  return (r * (pv - discFV)) / (1 - Math.pow(1 + r, -n));
}

export default function LoanTool() {
  // --- Core inputs ---
  const [loanType, setLoanType] = useState("Home"); // Home | Vehicle | Personal
  const [loanAmount, setLoanAmount] = useState("");
  const [deposit, setDeposit] = useState("");
  const [fees, setFees] = useState("");
  const [rateAnnualPct, setRateAnnualPct] = useState("");
  const [termYears, setTermYears] = useState("20");
  const [extraPmt, setExtraPmt] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);

  // Vehicle only
  const [balloonPct, setBalloonPct] = useState("0");

  // Personal only
  const [initiationFeeOnceOff, setInitiationFeeOnceOff] = useState("");
  const [monthlyServiceFee, setMonthlyServiceFee] = useState("");

  // Derived base values
  const { principal, rMonthly, nMonths, fvTarget, svcFeeMonthly, xtra } = useMemo(() => {
    const L = cleanNum(loanAmount);
    const D = cleanNum(deposit);
    const F = cleanNum(fees);
    const init = loanType === "Personal" ? cleanNum(initiationFeeOnceOff) : 0;

    // Financed principal = purchase - deposit + financed fees + (personal initiation fee)
    const P = Math.max(0, L - D) + F + init;

    const r = cleanNum(rateAnnualPct) / 100 / 12;
    const n = Math.max(0, Math.round(cleanNum(termYears) * 12));

    const balloon = loanType === "Vehicle" ? Math.max(0, cleanNum(balloonPct)) / 100 : 0;
    const FV = balloon > 0 ? P * balloon : 0;

    const svc = loanType === "Personal" ? cleanNum(monthlyServiceFee) : 0;
    const x = cleanNum(extraPmt);

    return { principal: P, rMonthly: r, nMonths: n, fvTarget: FV, svcFeeMonthly: svc, xtra: x };
  }, [
    loanAmount,
    deposit,
    fees,
    initiationFeeOnceOff,
    rateAnnualPct,
    termYears,
    loanType,
    balloonPct,
    monthlyServiceFee,
    extraPmt,
  ]);

  const calc = useMemo(() => {
    // Base instalment (excl. personal service fee & extra)
    const base = pmtWithFV(principal, rMonthly, nMonths, fvTarget);
    const pay = Math.max(0, base + svcFeeMonthly + xtra);

    let balance = principal;
    let totalInterest = 0;
    let months = 0;
    const schedule = [];

    if (principal <= 0 || nMonths === 0) {
      return {
        basePmt: 0,
        extraPmt: xtra,
        serviceFee: svcFeeMonthly,
        pay,
        totalInterest: 0,
        totalPaid: 0,
        payoffMonths: 0,
        finalBalance: 0,
        schedule: [],
      };
    }

    // Simulate
    for (let i = 1; i <= nMonths; i++) {
      const interest = balance * rMonthly;
      const principalFromBase = Math.max(0, base - interest); // base excludes service fee
      const principalPortion = Math.min(balance, principalFromBase + xtra);
      const actualPayment = principalPortion + interest + svcFeeMonthly;

      balance = Math.max(0, balance - principalPortion);
      totalInterest += interest;
      months = i;

      if (showSchedule) {
        schedule.push({
          period: i,
          payment: actualPayment,
          interest,
          principal: principalPortion,
          serviceFee: svcFeeMonthly,
          balance,
        });
      }

      // Early payoff guard on zero-rate & zero-pay edge (unlikely)
      if (rMonthly === 0 && actualPayment === 0) break;
      if (loanType !== "Vehicle" && balance <= 0.005) break; // Home/Personal typically go to zero
      // For Vehicle we keep sim to n months so final balance ≈ balloon (reduced by extras)
    }

    const totalPaid =
      schedule.length > 0
        ? schedule.reduce((s, r) => s + r.payment, 0)
        : (base + svcFeeMonthly + xtra) * nMonths;

    return {
      basePmt: base,
      extraPmt: xtra,
      serviceFee: svcFeeMonthly,
      pay,
      totalInterest,
      totalPaid,
      payoffMonths: months,
      finalBalance: balance, // for Vehicle ≈ balloon; for Home/Personal ≈ 0 (or earlier)
      schedule,
    };
  }, [principal, rMonthly, nMonths, fvTarget, svcFeeMonthly, xtra, showSchedule, loanType]);

  const reset = () => {
    setLoanType("Home");
    setLoanAmount("");
    setDeposit("");
    setFees("");
    setRateAnnualPct("");
    setTermYears("20");
    setExtraPmt("");
    setBalloonPct("0");
    setInitiationFeeOnceOff("");
    setMonthlyServiceFee("");
    setShowSchedule(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Scend • Loan Tool</h1>

      {/* Loan Type & Amount */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Loan type</div>
          <select
            className="border rounded p-2 w-full"
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
          >
            <option>Home</option>
            <option>Vehicle</option>
            <option>Personal</option>
          </select>
        </label>

        <label className="block md:col-span-2">
          <div className="text-sm font-medium mb-1">Loan amount / Purchase price</div>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. 1,200,000"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
          />
        </label>
      </div>

      {/* Money in/out + type-specific fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Deposit (upfront)</div>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. 120,000"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">
            {loanType === "Home"
              ? "Bond/Legal fees financed (once-off)"
              : loanType === "Vehicle"
              ? "On-road/Dealer fees financed (once-off)"
              : "Other once-off fees financed"}
          </div>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. 6,000"
            value={fees}
            onChange={(e) => setFees(e.target.value)}
          />
        </label>

        {loanType === "Vehicle" && (
          <label className="block">
            <div className="text-sm font-medium mb-1">Balloon / Residual (%)</div>
            <input
              className="border rounded p-2 w-full"
              placeholder="e.g. 35"
              value={balloonPct}
              onChange={(e) => setBalloonPct(e.target.value)}
            />
          </label>
        )}

        {loanType === "Personal" && (
          <>
            <label className="block">
              <div className="text-sm font-medium mb-1">Initiation fee (once-off, financed)</div>
              <input
                className="border rounded p-2 w-full"
                placeholder="e.g. 1,207"
                value={initiationFeeOnceOff}
                onChange={(e) => setInitiationFeeOnceOff(e.target.value)}
              />
            </label>
            <label className="block">
              <div className="text-sm font-medium mb-1">Monthly service fee</div>
              <input
                className="border rounded p-2 w-full"
                placeholder="e.g. 69"
                value={monthlyServiceFee}
                onChange={(e) => setMonthlyServiceFee(e.target.value)}
              />
            </label>
          </>
        )}
      </div>

      {/* Rate, Term, Extra */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Interest rate (annual %)</div>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. 13.25"
            value={rateAnnualPct}
            onChange={(e) => setRateAnnualPct(e.target.value)}
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Term (years)</div>
          <input
            className="border rounded p-2 w-full"
            placeholder={loanType === "Vehicle" ? "e.g. 6" : loanType === "Personal" ? "e.g. 5" : "e.g. 20"}
            value={termYears}
            onChange={(e) => setTermYears(e.target.value)}
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Extra payment (per month)</div>
        <input
            className="border rounded p-2 w-full"
            placeholder="e.g. 1,000"
            value={extraPmt}
            onChange={(e) => setExtraPmt(e.target.value)}
          />
        </label>
      </div>

      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={showSchedule}
          onChange={(e) => setShowSchedule(e.target.checked)}
        />
        <span>Show amortisation schedule</span>
      </label>

      {/* Results */}
      <div className="mt-4 border rounded p-4">
        <div className="text-lg font-semibold mb-2">Summary</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <div>Loan type: <strong>{loanType}</strong></div>
          <div>Principal financed: <strong>{ZAR.format(principal)}</strong></div>
          <div>Rate (monthly): <strong>{pct(rMonthly)}</strong></div>
          <div>Term: <strong>{nMonths} months</strong></div>
          {loanType === "Vehicle" && (
            <div>Balloon target at term: <strong>{ZAR.format(fvTarget)}</strong></div>
          )}
          {loanType === "Personal" && (
            <>
              <div>Monthly service fee: <strong>{ZAR.format(svcFeeMonthly)}</strong></div>
              <div>Initiation fee (financed): <strong>{ZAR.format(cleanNum(initiationFeeOnceOff))}</strong></div>
            </>
          )}
          <div>
            Base payment{loanType === "Personal" ? " (excl. service fee)" : ""}:{" "}
            <strong>{ZAR.format(calc.basePmt)}</strong>
          </div>
          <div>Extra payment: <strong>{ZAR.format(calc.extraPmt)}</strong></div>
          <div>Total monthly payment: <strong>{ZAR.format(calc.pay)}</strong></div>
          <div>Total interest (approx): <strong>{ZAR.format(calc.totalInterest)}</strong></div>
          <div>Total paid (approx): <strong>{ZAR.format(calc.totalPaid)}</strong></div>
          <div>Simulated months: <strong>{calc.payoffMonths}</strong></div>
          {loanType === "Vehicle" && (
            <div>Estimated balloon due at term: <strong>{ZAR.format(Math.max(0, calc.finalBalance))}</strong></div>
          )}
        </div>

        {showSchedule && calc.schedule.length > 0 && (
          <div className="mt-4">
            <div className="text-md font-medium mb-2">Amortisation schedule (first 120 rows shown)</div>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-2 py-1 text-left">#</th>
                    <th className="border px-2 py-1 text-left">Payment</th>
                    <th className="border px-2 py-1 text-left">Interest</th>
                    <th className="border px-2 py-1 text-left">Principal</th>
                    <th className="border px-2 py-1 text-left">Service fee</th>
                    <th className="border px-2 py-1 text-left">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.schedule.slice(0, 120).map((row) => (
                    <tr key={row.period}>
                      <td className="border px-2 py-1">{row.period}</td>
                      <td className="border px-2 py-1">{ZAR.format(row.payment)}</td>
                      <td className="border px-2 py-1">{ZAR.format(row.interest)}</td>
                      <td className="border px-2 py-1">{ZAR.format(row.principal)}</td>
                      <td className="border px-2 py-1">{ZAR.format(row.serviceFee)}</td>
                      <td className="border px-2 py-1">{ZAR.format(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button className="px-4 py-2 rounded border" onClick={reset}>Clear</button>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Notes: Home = standard amortisation. Vehicle = payment set to reach a residual (balloon) at term; extra payments reduce the balloon.
          Personal = initiation fee can be financed into principal; monthly service fee is added to each instalment.
        </div>
      </div>
    </div>
  );
}
