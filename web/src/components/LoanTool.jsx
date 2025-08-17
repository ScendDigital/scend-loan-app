// web/src/components/LoanTool.jsx
"use client";

import { useEffect, useMemo, useState } from "react";

const ZAR = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });
const pct = (n) => `${(n * 100).toFixed(2)}%`;

function cleanNum(v) {
  const n = parseFloat(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

// Payment with future value (balloon) support
// pv: principal, r: monthly rate, n: months, fv: balance remaining at term
function pmtWithFV(pv, r, n, fv = 0) {
  if (n <= 0) return 0;
  if (r === 0) return (pv - fv) / n;
  const discFV = fv / Math.pow(1 + r, n);
  return (r * (pv - discFV)) / (1 - Math.pow(1 + r, -n));
}

/** Simple scorecard (300–850) based on a few inputs */
function estimateCreditScore({
  preDTI,                // existingDebt / income (0..1)
  utilization,           // 0..1 (can be null)
  missedPayments12m,     // integer
  creditAgeYears,        // years
  inquiries6m,           // integer
}) {
  let score = 680; // baseline

  // Payment history
  if (missedPayments12m <= 0) score += 60;
  else if (missedPayments12m === 1) score += 20;
  else if (missedPayments12m === 2) score -= 20;
  else if (missedPayments12m === 3) score -= 50;
  else score -= 90;

  // Utilization (if provided)
  if (Number.isFinite(utilization)) {
    if (utilization <= 0.10) score += 40;
    else if (utilization <= 0.30) score += 20;
    else if (utilization <= 0.50) score += 0;
    else if (utilization <= 0.75) score -= 40;
    else if (utilization <= 1.00) score -= 80;
    else score -= 120;
  }

  // Pre-loan DTI (existing only)
  if (Number.isFinite(preDTI)) {
    if (preDTI <= 0.20) score += 35;
    else if (preDTI <= 0.36) score += 15;
    else if (preDTI <= 0.43) score += 0;
    else if (preDTI <= 0.50) score -= 20;
    else score -= 50;
  }

  // Credit age
  if (creditAgeYears >= 9) score += 25;
  else if (creditAgeYears >= 5) score += 10;
  else if (creditAgeYears >= 2) score -= 5;
  else score -= 25;

  // Inquiries (last 6m)
  if (inquiries6m <= 0) score += 15;
  else if (inquiries6m === 1) score += 5;
  else if (inquiries6m === 2) score -= 10;
  else if (inquiries6m === 3) score -= 25;
  else score -= 40;

  return clamp(Math.round(score), 300, 850);
}

/** Rate tiers per type & score. basePrime is editable; for cards we return absolute APRs. */
function rateFromScore(loanType, score, basePrime) {
  const s = score;
  const prime = basePrime;

  // margins over prime (or absolute APRs for CC)
  if (loanType === "Home") {
    if (s >= 780) return prime + 0.75;
    if (s >= 740) return prime + 1.00;
    if (s >= 700) return prime + 1.50;
    if (s >= 660) return prime + 2.25;
    if (s >= 620) return prime + 3.50;
    return prime + 5.00;
  }
  if (loanType === "Vehicle") {
    if (s >= 780) return prime + 1.50;
    if (s >= 740) return prime + 2.00;
    if (s >= 700) return prime + 3.00;
    if (s >= 660) return prime + 4.50;
    if (s >= 620) return prime + 6.50;
    return prime + 9.00;
  }
  if (loanType === "Personal") {
    if (s >= 780) return prime + 5;
    if (s >= 740) return prime + 7;
    if (s >= 700) return prime + 9;
    if (s >= 660) return prime + 12;
    if (s >= 620) return prime + 16;
    return prime + 22;
  }
  // Credit Card — absolute APR bands
  if (s >= 780) return 15;
  if (s >= 740) return 18;
  if (s >= 700) return 22;
  if (s >= 660) return 26;
  if (s >= 620) return 30;
  return 36;
}

const DTI_LIMITS = { Home: 0.36, Vehicle: 0.45, Personal: 0.50, "Credit Card": 0.50 };

export default function LoanTool() {
  // --- Applicant profile (for score & DTI) ---
  const [grossIncome, setGrossIncome] = useState("");      // monthly gross income
  const [existingDebt, setExistingDebt] = useState("");    // monthly debt obligations (other loans/cards)
  const [creditAgeYears, setCreditAgeYears] = useState("5");
  const [missedPayments12m, setMissedPayments12m] = useState("0");
  const [inquiries6m, setInquiries6m] = useState("0");
  const [utilizationPct, setUtilizationPct] = useState(""); // mostly relevant to Credit Cards

  // Base/Prime (editable)
  const [basePrimePct, setBasePrimePct] = useState("11.75");

  // --- Core loan inputs ---
  const [loanType, setLoanType] = useState("Home"); // Home | Vehicle | Personal | Credit Card
  const [loanAmount, setLoanAmount] = useState("");
  const [deposit, setDeposit] = useState("");
  const [fees, setFees] = useState("");

  // Rate handling: auto from score (with optional override)
  const [overrideRate, setOverrideRate] = useState(false);
  const [rateAnnualPct, setRateAnnualPct] = useState(""); // editable only if overrideRate=true

  const [termYears, setTermYears] = useState("20"); // not used for Credit Card
  const [extraPmt, setExtraPmt] = useState("");     // for CC: planned monthly payment
  const [showSchedule, setShowSchedule] = useState(false);

  // Vehicle only
  const [balloonPct, setBalloonPct] = useState("0");

  // Personal only
  const [initiationFeeOnceOff, setInitiationFeeOnceOff] = useState("");
  const [monthlyServiceFee, setMonthlyServiceFee] = useState("");

  // Credit Card only
  const [ccMinPct, setCcMinPct] = useState("3");     // % of balance
  const [ccMinAbs, setCcMinAbs] = useState("50");    // currency floor

  // --- Derived numbers for scoring/DTI ---
  const income = cleanNum(grossIncome);
  const otherDebt = cleanNum(existingDebt);
  const preDTI = income > 0 ? otherDebt / income : NaN;

  const score = useMemo(
    () =>
      estimateCreditScore({
        preDTI,
        utilization: utilizationPct === "" ? NaN : cleanNum(utilizationPct) / 100,
        missedPayments12m: Math.max(0, Math.floor(cleanNum(missedPayments12m))),
        creditAgeYears: Math.max(0, cleanNum(creditAgeYears)),
        inquiries6m: Math.max(0, Math.floor(cleanNum(inquiries6m))),
      }),
    [preDTI, utilizationPct, missedPayments12m, creditAgeYears, inquiries6m]
  );

  // Auto-rate from score & type (updates live unless overridden)
  const autoRate = useMemo(
    () => rateFromScore(loanType, score, cleanNum(basePrimePct)),
    [loanType, score, basePrimePct]
  );
  useEffect(() => {
    if (!overrideRate) setRateAnnualPct(String(autoRate.toFixed(2)));
  }, [autoRate, overrideRate]);

  const rateUsed = overrideRate ? cleanNum(rateAnnualPct) : autoRate;
  const rMonthly = rateUsed / 100 / 12;

  // --- Build per-type principal & parameters ---
  const { principal, nMonths, fvTarget, svcFeeMonthly, plannedPayment } = useMemo(() => {
    const L = cleanNum(loanAmount);
    const D = cleanNum(deposit);
    const F = cleanNum(fees);
    const init = loanType === "Personal" ? cleanNum(initiationFeeOnceOff) : 0;
    const svc = loanType === "Personal" ? cleanNum(monthlyServiceFee) : 0;

    const P = Math.max(0, L - (loanType === "Credit Card" ? 0 : D)) + F + init;

    const n = loanType === "Credit Card" ? 0 : Math.max(0, Math.round(cleanNum(termYears) * 12));
    const balloon = loanType === "Vehicle" ? Math.max(0, cleanNum(balloonPct)) / 100 : 0;
    const FV = balloon > 0 ? P * balloon : 0;

    const planned = loanType === "Credit Card" ? cleanNum(extraPmt) : 0;

    return { principal: P, nMonths: n, fvTarget: FV, svcFeeMonthly: svc, plannedPayment: planned };
  }, [
    loanAmount, deposit, fees, initiationFeeOnceOff, monthlyServiceFee, termYears,
    loanType, balloonPct, extraPmt
  ]);

  // --- Core calculation (handles four types) ---
  const calc = useMemo(() => {
    if (principal <= 0) {
      return {
        type: loanType,
        basePmt: 0,
        extraPmt: loanType === "Credit Card" ? 0 : cleanNum(extraPmt),
        serviceFee: svcFeeMonthly,
        pay: 0,
        totalInterest: 0,
        totalPaid: 0,
        payoffMonths: 0,
        finalBalance: 0,
        schedule: [],
        ccMinPayment: 0,
      };
    }

    // CREDIT CARD branch: revolve; compute min payment and payoff with plannedPayment
    if (loanType === "Credit Card") {
      const minPct = clamp(cleanNum(ccMinPct) / 100, 0, 1);
      const minAbs = Math.max(0, cleanNum(ccMinAbs));

      let balance = principal;
      let months = 0;
      let totalInterest = 0;
      const schedule = [];
      const startMinPayment = Math.max(minAbs, balance * minPct);

      // planned payment default = at least the first min payment
      let planned = plannedPayment > 0 ? plannedPayment : startMinPayment;

      // Avoid pathological zero-payment cases
      if (planned <= 0 && startMinPayment <= 0) {
        return {
          type: loanType,
          basePmt: 0,
          extraPmt: 0,
          serviceFee: 0,
          pay: 0,
          totalInterest: 0,
          totalPaid: 0,
          payoffMonths: 0,
          finalBalance: balance,
          schedule: [],
          ccMinPayment: 0,
        };
      }

      // Simulate until paid or 600 months cap
      while (balance > 0.005 && months < 600) {
        months++;
        const interest = balance * rMonthly;
        const minPayThisMonth = Math.max(minAbs, balance * minPct);
        const pmt = Math.max(planned, minPayThisMonth);
        const principalPortion = Math.max(0, pmt - interest);
        const actualPrincipal = Math.min(balance, principalPortion);
        const actualPayment = actualPrincipal + interest;

        balance = Math.max(0, balance - actualPrincipal);
        totalInterest += interest;

        if (showSchedule) {
          schedule.push({
            period: months,
            payment: actualPayment,
            interest,
            principal: actualPrincipal,
            serviceFee: 0,
            balance,
          });
        }

        // Guard against negative amortisation (payment <= interest) -> bump to interest+1
        if (pmt <= interest) {
          planned = interest + 1;
        }
      }

      const totalPaid =
        schedule.length > 0
          ? schedule.reduce((s, r) => s + r.payment, 0)
          : months * planned;

      return {
        type: loanType,
        basePmt: 0,
        extraPmt: planned,
        serviceFee: 0,
        pay: planned,
        totalInterest,
        totalPaid,
        payoffMonths: months,
        finalBalance: balance,
        schedule,
        ccMinPayment: startMinPayment,
      };
    }

    // HOME / VEHICLE / PERSONAL branch
    const base = pmtWithFV(principal, rMonthly, nMonths, fvTarget);
    const xtra = cleanNum(extraPmt);
    const pay = Math.max(0, base + svcFeeMonthly + xtra);

    let balance = principal;
    let totalInterest = 0;
    let months = 0;
    const schedule = [];

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

      if (loanType !== "Vehicle" && balance <= 0.005) break; // mortgages/personal often end early with extra
    }

    const totalPaid =
      schedule.length > 0
        ? schedule.reduce((s, r) => s + r.payment, 0)
        : (base + svcFeeMonthly + xtra) * (nMonths || 0);

    return {
      type: loanType,
      basePmt: base,
      extraPmt: xtra,
      serviceFee: svcFeeMonthly,
      pay,
      totalInterest,
      totalPaid,
      payoffMonths: months,
      finalBalance: balance, // Vehicle ≈ balloon (reduced by extras), others ≈ 0
      schedule,
      ccMinPayment: 0,
    };
  }, [
    loanType, principal, rMonthly, nMonths, fvTarget, svcFeeMonthly, extraPmt,
    plannedPayment, ccMinPct, ccMinAbs, showSchedule
  ]);

  // --- DTI (pre & post) ---
  const newMonthlyPayment = loanType === "Credit Card" ? calc.pay : calc.pay;
  const postDTI = income > 0 ? (otherDebt + newMonthlyPayment) / income : NaN;
  const dtiLimit = DTI_LIMITS[loanType] ?? 0.45;
  const dtiWarn = Number.isFinite(postDTI) && postDTI > dtiLimit;

  const reset = () => {
    setGrossIncome(""); setExistingDebt(""); setCreditAgeYears("5");
    setMissedPayments12m("0"); setInquiries6m("0"); setUtilizationPct("");
    setBasePrimePct("11.75");
    setLoanType("Home");
    setLoanAmount(""); setDeposit(""); setFees("");
    setOverrideRate(false); setRateAnnualPct("");
    setTermYears("20"); setExtraPmt("");
    setBalloonPct("0"); setInitiationFeeOnceOff(""); setMonthlyServiceFee("");
    setCcMinPct("3"); setCcMinAbs("50");
    setShowSchedule(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Scend • Loan Tool</h1>

      {/* Applicant profile (affects score, auto-rate & DTI) */}
      <div className="border rounded p-4 space-y-3">
        <div className="font-medium">Applicant profile</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <div className="text-sm mb-1">Gross income (per month)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 45,000"
                   value={grossIncome} onChange={(e) => setGrossIncome(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Existing debt payments (per month)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 8,500"
                   value={existingDebt} onChange={(e) => setExistingDebt(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Credit utilization (%)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 25"
                   value={utilizationPct} onChange={(e) => setUtilizationPct(e.target.value)} />
          </label>

          <label className="block">
            <div className="text-sm mb-1">Missed payments (last 12m)</div>
            <input className="border rounded p-2 w-full" placeholder="0"
                   value={missedPayments12m} onChange={(e) => setMissedPayments12m(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Credit age (years)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 6"
                   value={creditAgeYears} onChange={(e) => setCreditAgeYears(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Inquiries (last 6m)</div>
            <input className="border rounded p-2 w-full" placeholder="0"
                   value={inquiries6m} onChange={(e) => setInquiries6m(e.target.value)} />
          </label>
        </div>
      </div>

      {/* Type & base rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Loan type</div>
          <select className="border rounded p-2 w-full"
                  value={loanType} onChange={(e) => setLoanType(e.target.value)}>
            <option>Home</option>
            <option>Vehicle</option>
            <option>Personal</option>
            <option>Credit Card</option>
          </select>
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Base/Prime rate (annual %)</div>
          <input className="border rounded p-2 w-full" placeholder="11.75"
                 value={basePrimePct} onChange={(e) => setBasePrimePct(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Interest rate (annual %)</div>
          <div className="flex gap-2">
            <input className="border rounded p-2 w-full"
                   value={rateAnnualPct}
                   onChange={(e) => setRateAnnualPct(e.target.value)}
                   disabled={!overrideRate}
                   placeholder={autoRate.toFixed(2)} />
            <label className="inline-flex items-center gap-2 shrink-0">
              <input type="checkbox" checked={overrideRate} onChange={(e) => setOverrideRate(e.target.checked)} />
              <span className="text-sm">Override</span>
            </label>
          </div>
        </label>
      </div>

      {/* Amounts & type-specific fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">
            {loanType === "Credit Card" ? "Card balance / Purchase amount" : "Loan amount / Purchase price"}
          </div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 1,200,000 / 25,000"
                 value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
        </label>

        {loanType !== "Credit Card" && (
          <label className="block">
            <div className="text-sm font-medium mb-1">Deposit (upfront)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 120,000"
                   value={deposit} onChange={(e) => setDeposit(e.target.value)} />
          </label>
        )}

        <label className="block">
          <div className="text-sm font-medium mb-1">
            {loanType === "Home"
              ? "Bond/Legal fees financed (once-off)"
              : loanType === "Vehicle"
              ? "On-road/Dealer fees financed (once-off)"
              : loanType === "Credit Card"
              ? "Once-off fees added"
              : "Other once-off fees financed"}
          </div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 6,000"
                 value={fees} onChange={(e) => setFees(e.target.value)} />
        </label>

        {loanType === "Vehicle" && (
          <label className="block">
            <div className="text-sm font-medium mb-1">Balloon / Residual (%)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 35"
                   value={balloonPct} onChange={(e) => setBalloonPct(e.target.value)} />
          </label>
        )}

        {loanType === "Personal" && (
          <>
            <label className="block">
              <div className="text-sm font-medium mb-1">Initiation fee (once-off, financed)</div>
              <input className="border rounded p-2 w-full" placeholder="e.g. 1,207"
                     value={initiationFeeOnceOff} onChange={(e) => setInitiationFeeOnceOff(e.target.value)} />
            </label>
            <label className="block">
              <div className="text-sm font-medium mb-1">Monthly service fee</div>
              <input className="border rounded p-2 w-full" placeholder="e.g. 69"
                     value={monthlyServiceFee} onChange={(e) => setMonthlyServiceFee(e.target.value)} />
            </label>
          </>
        )}

        {loanType !== "Credit Card" && (
          <label className="block">
            <div className="text-sm font-medium mb-1">Term (years)</div>
            <input className="border rounded p-2 w-full"
                   placeholder={loanType === "Vehicle" ? "e.g. 6" : loanType === "Personal" ? "e.g. 5" : "e.g. 20"}
                   value={termYears} onChange={(e) => setTermYears(e.target.value)} />
          </label>
        )}

        {loanType === "Credit Card" ? (
          <>
            <label className="block">
              <div className="text-sm font-medium mb-1">Planned payment (per month)</div>
              <input className="border rounded p-2 w-full" placeholder="e.g. 1,200"
                     value={extraPmt} onChange={(e) => setExtraPmt(e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <div className="text-sm font-medium mb-1">Minimum payment %</div>
                <input className="border rounded p-2 w-full" placeholder="3"
                       value={ccMinPct} onChange={(e) => setCcMinPct(e.target.value)} />
              </label>
              <label className="block">
                <div className="text-sm font-medium mb-1">Minimum payment absolute</div>
                <input className="border rounded p-2 w-full" placeholder="50"
                       value={ccMinAbs} onChange={(e) => setCcMinAbs(e.target.value)} />
              </label>
            </div>
          </>
        ) : (
          <label className="block">
            <div className="text-sm font-medium mb-1">Extra payment (per month)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 1,000"
                   value={extraPmt} onChange={(e) => setExtraPmt(e.target.value)} />
          </label>
        )}
      </div>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={showSchedule} onChange={(e) => setShowSchedule(e.target.checked)} />
        <span>Show amortisation schedule</span>
      </label>

      {/* Results */}
      <div className="mt-4 border rounded p-4">
        <div className="text-lg font-semibold mb-2">Summary</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <div>Loan type: <strong>{loanType}</strong></div>
          <div>Estimated credit score: <strong>{score}</strong></div>
          <div>Interest rate (auto): <strong>{autoRate.toFixed(2)}%</strong>{overrideRate ? " (overridden)" : ""}</div>
          <div>Rate (monthly): <strong>{pct(rMonthly)}</strong></div>

          <div>Principal financed: <strong>{ZAR.format(principal)}</strong></div>
          {loanType !== "Credit Card" && <div>Term: <strong>{nMonths} months</strong></div>}
          {loanType === "Vehicle" && <div>Balloon target at term: <strong>{ZAR.format(fvTarget)}</strong></div>}
          {loanType === "Personal" && (
            <>
              <div>Monthly service fee: <strong>{ZAR.format(svcFeeMonthly)}</strong></div>
              <div>Initiation fee (financed): <strong>{ZAR.format(cleanNum(initiationFeeOnceOff))}</strong></div>
            </>
          )}

          {loanType === "Credit Card" ? (
            <>
              <div>Minimum payment (start): <strong>{ZAR.format(calc.ccMinPayment)}</strong></div>
              <div>Planned payment (used): <strong>{ZAR.format(calc.pay)}</strong></div>
              <div>Estimated months to payoff: <strong>{calc.payoffMonths}</strong></div>
            </>
          ) : (
            <>
              <div>Base instalment{loanType === "Personal" ? " (excl. service fee)" : ""}: <strong>{ZAR.format(calc.basePmt)}</strong></div>
              <div>Extra payment: <strong>{ZAR.format(calc.extraPmt)}</strong></div>
              <div>Total monthly payment: <strong>{ZAR.format(calc.pay)}</strong></div>
            </>
          )}

          <div>Total interest (approx): <strong>{ZAR.format(calc.totalInterest)}</strong></div>
          <div>Total paid (approx): <strong>{ZAR.format(calc.totalPaid)}</strong></div>

          {/* DTI */}
          <div>Pre-loan DTI: <strong>{Number.isFinite(preDTI) ? pct(preDTI) : "—"}</strong></div>
          <div>
            Post-loan DTI:{" "}
            <strong className={dtiWarn ? "text-red-600" : ""}>
              {Number.isFinite(postDTI) ? pct(postDTI) : "—"}
            </strong>
            {Number.isFinite(postDTI) && (
              <span className="text-sm text-gray-600"> (limit ~{pct(DTI_LIMITS[loanType] ?? 0.45)})</span>
            )}
          </div>

          {loanType === "Vehicle" && (
            <div>Estimated balloon due at term: <strong>{ZAR.format(Math.max(0, calc.finalBalance))}</strong></div>
          )}
        </div>

        {showSchedule && calc.schedule.length > 0 && (
          <div className="mt-4">
            <div className="text-md font-medium mb-2">
              Amortisation schedule (first 120 rows shown{loanType === "Credit Card" ? ", variable min payment" : ""})
            </div>
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
          Notes: Credit score & auto-rate are heuristic for planning only. DTI thresholds vary by lender;
          this tool flags post-loan DTI above typical limits ({Object.entries(DTI_LIMITS).map(([k,v]) => `${k} ${pct(v)}`).join(", ")}).
        </div>
      </div>
    </div>
  );
}
