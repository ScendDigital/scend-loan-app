"use client";

import { useMemo, useState } from "react";

const ZAR = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });
const pct = (n) => `${(n * 100).toFixed(2)}%`;

function cleanNum(v) {
  const n = parseFloat(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function monthlyPayment(pv, r, n) {
  // pv = principal, r = monthly rate (e.g. 0.13/12), n = months
  if (n <= 0) return 0;
  if (r === 0) return pv / n;
  return (r * pv) / (1 - Math.pow(1 + r, -n));
}

export default function LoanTool() {
  // Inputs
  const [loanAmount, setLoanAmount] = useState("");    // loan amount (or purchase price)
  const [deposit, setDeposit] = useState("");          // upfront deposit (reduces principal)
  const [fees, setFees] = useState("");                // once-off fees added to loan
  const [rateAnnualPct, setRateAnnualPct] = useState(""); // nominal annual rate, e.g. 13.25
  const [termYears, setTermYears] = useState("20");    // years
  const [extraPmt, setExtraPmt] = useState("");        // voluntary extra monthly payment
  const [showSchedule, setShowSchedule] = useState(false);

  // Derived
  const { principal, rMonthly, nMonths } = useMemo(() => {
    const L = cleanNum(loanAmount);
    const D = cleanNum(deposit);
    const F = cleanNum(fees);
    const P = Math.max(0, L - D) + F;

    const r = cleanNum(rateAnnualPct) / 100 / 12;
    const n = Math.max(0, Math.round(cleanNum(termYears) * 12));

    return { principal: P, rMonthly: r, nMonths: n };
  }, [loanAmount, deposit, fees, rateAnnualPct, termYears]);

  const calc = useMemo(() => {
    const base = monthlyPayment(principal, rMonthly, nMonths);
    const xtra = cleanNum(extraPmt);
    const pay = Math.max(0, base + xtra);

    // Build schedule only if requested
    let balance = principal;
    let totalInterest = 0;
    let months = 0;
    const schedule = [];

    // guard against degenerate inputs
    if (principal <= 0 || nMonths === 0) {
      return { basePmt: 0, extraPmt: xtra, pay, totalInterest: 0, totalPaid: 0, payoffMonths: 0, schedule: [] };
    }

    for (let i = 1; i <= nMonths && balance > 0.005; i++) {
      const interest = balance * rMonthly;
      const principalPortion = Math.min(balance, Math.max(0, pay - interest));
      const actualPayment = principalPortion + interest;

      balance = Math.max(0, balance - principalPortion);
      totalInterest += interest;
      months = i;

      if (showSchedule) {
        schedule.push({
          period: i,
          payment: actualPayment,
          interest,
          principal: principalPortion,
          balance,
        });
      }

      // If rate is 0 and pay == 0, avoid infinite loop
      if (rMonthly === 0 && pay === 0) break;
    }

    const totalPaid = principal + totalInterest;
    return {
      basePmt: base,
      extraPmt: xtra,
      pay,
      totalInterest,
      totalPaid,
      payoffMonths: months,
      schedule,
    };
  }, [principal, rMonthly, nMonths, extraPmt, showSchedule]);

  const reset = () => {
    setLoanAmount("");
    setDeposit("");
    setFees("");
    setRateAnnualPct("");
    setTermYears("20");
    setExtraPmt("");
    setShowSchedule(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Scend • Loan Tool</h1>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Loan amount / Purchase price</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 1,200,000"
                 value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Deposit (upfront)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 120,000"
                 value={deposit} onChange={(e) => setDeposit(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Once-off fees (added to loan)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 6,000"
                 value={fees} onChange={(e) => setFees(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Interest rate (annual %)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 13.25"
                 value={rateAnnualPct} onChange={(e) => setRateAnnualPct(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Term (years)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 20"
                 value={termYears} onChange={(e) => setTermYears(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Extra payment (per month)</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 1,000"
                 value={extraPmt} onChange={(e) => setExtraPmt(e.target.value)} />
        </label>
      </div>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={showSchedule} onChange={(e) => setShowSchedule(e.target.checked)} />
        <span>Show amortisation schedule</span>
      </label>

      {/* Results */}
      <div className="mt-4 border rounded p-4">
        <div className="text-lg font-semibold mb-2">Summary</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <div>Principal financed: <strong>{ZAR.format(principal)}</strong></div>
          <div>Rate (monthly): <strong>{pct(rMonthly)}</strong></div>
          <div>Term: <strong>{nMonths} months</strong></div>
          <div>Base payment: <strong>{ZAR.format(calc.basePmt)}</strong></div>
          <div>Extra payment: <strong>{ZAR.format(calc.extraPmt)}</strong></div>
          <div>Total monthly payment: <strong>{ZAR.format(calc.pay)}</strong></div>
          <div>Total interest: <strong>{ZAR.format(calc.totalInterest)}</strong></div>
          <div>Total paid: <strong>{ZAR.format(calc.totalPaid)}</strong></div>
          <div>Estimated payoff: <strong>{calc.payoffMonths} months</strong></div>
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
          Notes: Payment formula uses standard amortisation. If the rate is 0%, payment is principal ÷ months. Extra payments shorten the term and reduce interest.
        </div>
      </div>
    </div>
  );
}
