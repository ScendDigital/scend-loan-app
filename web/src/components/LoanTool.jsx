// web/src/components/LoanTool.jsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";

const ZAR = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });
const pct = (n) => `${(n * 100).toFixed(2)}%`;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function cleanNum(v) {
  const n = parseFloat(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// Payment with future value (balloon) support
function pmtWithFV(pv, r, n, fv = 0) {
  if (n <= 0) return 0;
  if (r === 0) return (pv - fv) / n;
  const discFV = fv / Math.pow(1 + r, n);
  return (r * (pv - discFV)) / (1 - Math.pow(1 + r, -n));
}

/** Simple scorecard (300–850) */
function estimateCreditScore({ preDTI, utilization, missedPayments12m, creditAgeYears, inquiries6m }) {
  let score = 680;
  // Payment history
  if (missedPayments12m <= 0) score += 60;
  else if (missedPayments12m === 1) score += 20;
  else if (missedPayments12m === 2) score -= 20;
  else if (missedPayments12m === 3) score -= 50;
  else score -= 90;
  // Utilization
  if (Number.isFinite(utilization)) {
    if (utilization <= 0.10) score += 40;
    else if (utilization <= 0.30) score += 20;
    else if (utilization <= 0.50) score += 0;
    else if (utilization <= 0.75) score -= 40;
    else if (utilization <= 1.00) score -= 80;
    else score -= 120;
  }
  // Pre-loan DTI
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
  // Inquiries
  if (inquiries6m <= 0) score += 15;
  else if (inquiries6m === 1) score += 5;
  else if (inquiries6m === 2) score -= 10;
  else if (inquiries6m === 3) score -= 25;
  else score -= 40;

  return clamp(Math.round(score), 300, 850);
}

/** Rate tiers per type & score (APR). Home/Vehicle/Personal are prime + margin; Credit Card is absolute APR. */
function rateFromScore(loanType, score, basePrime) {
  const s = score, prime = basePrime;
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
  // Credit Card — absolute APR
  if (s >= 780) return 15;
  if (s >= 740) return 18;
  if (s >= 700) return 22;
  if (s >= 660) return 26;
  if (s >= 620) return 30;
  return 36;
}

// Policy knobs (heuristics)
const DTI_LIMITS = { Home: 0.36, Vehicle: 0.45, Personal: 0.50, "Credit Card": 0.50 };
const PTI_LIMITS = { Home: 0.28, Vehicle: 0.18, Personal: 0.12, "Credit Card": 0.08 };
const SCORE_MIN  = { Home: 640, Vehicle: 620, Personal: 600, "Credit Card": 580 };

export default function LoanTool() {
  // Applicant profile
  const [grossIncome, setGrossIncome] = useState("");
  const [existingDebt, setExistingDebt] = useState("");
  const [creditAgeYears, setCreditAgeYears] = useState("5");
  const [missedPayments12m, setMissedPayments12m] = useState("0");
  const [inquiries6m, setInquiries6m] = useState("0");
  const [utilizationPct, setUtilizationPct] = useState("");

  // Base/Prime
  const [basePrimePct, setBasePrimePct] = useState("11.75");

  // Loan inputs
  const [loanType, setLoanType] = useState("Home"); // Home | Vehicle | Personal | Credit Card
  const [loanAmount, setLoanAmount] = useState("");
  const [deposit, setDeposit] = useState("");
  const [fees, setFees] = useState("");

  // Rate override
  const [overrideRate, setOverrideRate] = useState(false);
  const [rateAnnualPct, setRateAnnualPct] = useState("");

  const [termYears, setTermYears] = useState("20"); // CC ignores term for base calc
  const [extraPmt, setExtraPmt] = useState("");     // CC: planned payment
  const [showSchedule, setShowSchedule] = useState(false);

  // Vehicle
  const [balloonPct, setBalloonPct] = useState("0");

  // Personal
  const [initiationFeeOnceOff, setInitiationFeeOnceOff] = useState("");
  const [monthlyServiceFee, setMonthlyServiceFee] = useState("");

  // Credit Card
  const [ccMinPct, setCcMinPct] = useState("3");
  const [ccMinAbs, setCcMinAbs] = useState("50");
  const [ccTargetMonths, setCcTargetMonths] = useState("24"); // for qualification

  // Derived (profile)
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

  const autoRate = useMemo(
    () => rateFromScore(loanType, score, cleanNum(basePrimePct)),
    [loanType, score, basePrimePct]
  );
  useEffect(() => {
    if (!overrideRate) setRateAnnualPct(String(autoRate.toFixed(2)));
  }, [autoRate, overrideRate]);

  const rateUsed = overrideRate ? cleanNum(rateAnnualPct) : autoRate;
  const rMonthly = rateUsed / 100 / 12;

  // Build per-type principal & parameters
  const { principal, nMonths, fvTarget, svcFeeMonthly, plannedPayment } = useMemo(() => {
    const L = cleanNum(loanAmount);
    const D = cleanNum(deposit);
    const F = cleanNum(fees);
    const init = loanType === "Personal" ? cleanNum(initiationFeeOnceOff) : 0;
    const svc = loanType === "Personal" ? cleanNum(monthlyServiceFee) : 0;

    // Financed principal = purchase - deposit + financed fees + (personal initiation)
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

  // Core calculation (payment, schedule)
  const calc = useMemo(() => {
    if (principal <= 0) {
      return {
        type: loanType, basePmt: 0, extraPmt: 0, serviceFee: 0, pay: 0,
        totalInterest: 0, totalPaid: 0, payoffMonths: 0, finalBalance: 0, schedule: [],
        ccMinPayment: 0,
      };
    }

    if (loanType === "Credit Card") {
      const minPct = clamp(cleanNum(ccMinPct) / 100, 0, 1);
      const minAbs = Math.max(0, cleanNum(ccMinAbs));
      let balance = principal, months = 0, totalInterest = 0;
      const schedule = [];
      const startMinPayment = Math.max(minAbs, balance * minPct);
      let planned = plannedPayment > 0 ? plannedPayment : startMinPayment;

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
            period: months, payment: actualPayment, interest,
            principal: actualPrincipal, serviceFee: 0, balance,
          });
        }

        if (pmt <= interest) planned = interest + 1; // avoid negative amortisation
      }

      const totalPaid = schedule.length > 0 ? schedule.reduce((s, r) => s + r.payment, 0) : months * planned;

      return {
        type: loanType,
        basePmt: 0, extraPmt: planned, serviceFee: 0, pay: planned,
        totalInterest, totalPaid, payoffMonths: months, finalBalance: balance, schedule,
        ccMinPayment: startMinPayment,
      };
    }

    // Home / Vehicle / Personal
    const base = pmtWithFV(principal, rMonthly, nMonths, fvTarget);
    const xtra = cleanNum(extraPmt);
    const pay = Math.max(0, base + svcFeeMonthly + xtra);

    let balance = principal, totalInterest = 0, months = 0;
    const schedule = [];

    for (let i = 1; i <= nMonths; i++) {
      const interest = balance * rMonthly;
      const principalFromBase = Math.max(0, base - interest);
      const principalPortion = Math.min(balance, principalFromBase + xtra);
      const actualPayment = principalPortion + interest + svcFeeMonthly;

      balance = Math.max(0, balance - principalPortion);
      totalInterest += interest;
      months = i;

      if (showSchedule) {
        schedule.push({ period: i, payment: actualPayment, interest, principal: principalPortion, serviceFee: svcFeeMonthly, balance });
      }
      if (loanType !== "Vehicle" && balance <= 0.005) break;
    }

    const totalPaid = schedule.length > 0 ? schedule.reduce((s, r) => s + r.payment, 0) : (base + svcFeeMonthly + xtra) * (nMonths || 0);

    return {
      type: loanType,
      basePmt: base, extraPmt: xtra, serviceFee: svcFeeMonthly, pay,
      totalInterest, totalPaid, payoffMonths: months, finalBalance: balance, schedule,
      ccMinPayment: 0,
    };
  }, [loanType, principal, rMonthly, nMonths, fvTarget, svcFeeMonthly, extraPmt, plannedPayment, ccMinPct, ccMinAbs, showSchedule]);

  // DTI / PTI & limits
  const newMonthlyPayment = calc.pay;
  const postDTI = income > 0 ? (otherDebt + newMonthlyPayment) / income : NaN;
  const dtiLimit = DTI_LIMITS[loanType] ?? 0.45;
  const pti = income > 0 ? newMonthlyPayment / income : NaN;
  const ptiLimit = PTI_LIMITS[loanType] ?? 0.20;

  // Eligibility verdict
  const minScore = SCORE_MIN[loanType] ?? 600;
  const scoreOK = score >= minScore;
  const dtiOK = Number.isFinite(postDTI) && postDTI <= dtiLimit;
  const ptiOK = Number.isFinite(pti) && pti <= ptiLimit;
  const ccPaySufficient = loanType !== "Credit Card" ? true : (calc.payoffMonths > 0 && calc.payoffMonths < 600);

  const hardFails = [];
  if (!(income > 0)) hardFails.push("Provide monthly gross income.");
  if (!scoreOK) hardFails.push(`Credit score below minimum for ${loanType} (needs ≥ ${minScore}).`);
  if (!dtiOK) hardFails.push(`Post-loan DTI ${Number.isFinite(postDTI) ? pct(postDTI) : "—"} exceeds limit ${pct(dtiLimit)}.`);
  if (!ptiOK) hardFails.push(`Payment-to-income ${Number.isFinite(pti) ? pct(pti) : "—"} exceeds cap ${pct(ptiLimit)}.`);
  if (!ccPaySufficient) hardFails.push(`Credit Card payment too low to amortise (increase above interest/min).`);

  const borderline =
    hardFails.length === 0 &&
    (
      (Number.isFinite(postDTI) && postDTI > dtiLimit * 0.95) ||
      (Number.isFinite(pti) && pti > ptiLimit * 0.95) ||
      (score >= minScore && score < minScore + 20) ||
      (loanType === "Vehicle" && cleanNum(balloonPct) > 35)
    );

  let verdict = "Eligible";
  let verdictTone = "bg-green-50 text-green-800 border-green-200";
  if (hardFails.length > 0) { verdict = "Not eligible"; verdictTone = "bg-red-50 text-red-800 border-red-200"; }
  else if (borderline) { verdict = "Conditional / Borderline"; verdictTone = "bg-amber-50 text-amber-900 border-amber-200"; }

  // Targets for recommendations
  const targetMaxPaymentDTI = income > 0 ? Math.max(0, income * dtiLimit - otherDebt) : NaN;
  const targetMaxPaymentPTI = income > 0 ? income * ptiLimit : NaN;

  // Credit-card payoff payment suggestions (12/24 months)
  const ccPay12 = loanType === "Credit Card" ? pmtWithFV(principal, rMonthly, 12, 0) : 0;
  const ccPay24 = loanType === "Credit Card" ? pmtWithFV(principal, rMonthly, 24, 0) : 0;

  // ---------- Qualification (max amount you can qualify for) ----------
  const paymentCapacity = useMemo(() => {
    const a = Number.isFinite(targetMaxPaymentDTI) ? targetMaxPaymentDTI : Infinity;
    const b = Number.isFinite(targetMaxPaymentPTI) ? targetMaxPaymentPTI : Infinity;
    const cap = Math.min(a, b);
    return cap < 0 || cap === Infinity ? 0 : cap;
  }, [targetMaxPaymentDTI, targetMaxPaymentPTI]);

  // Inverse formulas to find principal from payment capacity:
  function principalFromPayment_HomePersonal(payBase, r, n) {
    if (n <= 0 || payBase <= 0) return 0;
    if (r === 0) return payBase * n;
    return payBase * (1 - Math.pow(1 + r, -n)) / r;
  }
  function principalFromPayment_Vehicle(payBase, r, n, balloonFrac) {
    if (n <= 0 || payBase <= 0) return 0;
    if (r === 0) return payBase * n / (1 - balloonFrac); // since fv = P*balloon
    const denom = r * (1 - balloonFrac / Math.pow(1 + r, n));
    const num = payBase * (1 - Math.pow(1 + r, -n));
    if (denom <= 0) return 0;
    return num / denom;
  }
  function principalFromPayment_CreditCard(payPlan, r, targetMonths, minPct, minAbs) {
    if (payPlan <= 0) return 0;
    const n = Math.max(1, Math.round(targetMonths));
    // From PMT inversion (FV=0):
    const pFromTerm = r === 0 ? payPlan * n : payPlan * (1 - Math.pow(1 + r, -n)) / r;
    // Min-payment constraint: pay ≥ max(minAbs, minPct * P) -> P ≤ pay/minPct and pay ≥ minAbs.
    if (payPlan < minAbs) return 0;
    const pFromMinPct = minPct > 0 ? payPlan / minPct : pFromTerm;
    return Math.min(pFromTerm, pFromMinPct);
  }

  const qual = useMemo(() => {
    if (!(income > 0) || paymentCapacity <= 0) {
      return { maxPayment: 0, principalFinanced: 0, purchasePrice: 0 };
    }

    // Deduct monthly service fee (personal loans) to find base instalment we can spend
    const basePmtCapacity = Math.max(0, paymentCapacity - (loanType === "Personal" ? svcFeeMonthly : 0));

    let P = 0;
    if (loanType === "Home") {
      P = principalFromPayment_HomePersonal(basePmtCapacity, rMonthly, Math.max(1, nMonths));
    } else if (loanType === "Vehicle") {
      const balloonFrac = Math.max(0, cleanNum(balloonPct)) / 100;
      P = principalFromPayment_Vehicle(basePmtCapacity, rMonthly, Math.max(1, nMonths || 72), balloonFrac);
    } else if (loanType === "Personal") {
      P = principalFromPayment_HomePersonal(basePmtCapacity, rMonthly, Math.max(1, nMonths || 60));
    } else {
      // Credit Card: use target months & min payment rules
      const minPct = clamp(cleanNum(ccMinPct) / 100, 0, 1);
      const minAbs = Math.max(0, cleanNum(ccMinAbs));
      const tgtMonths = Math.max(1, Math.round(cleanNum(ccTargetMonths) || 24));
      P = principalFromPayment_CreditCard(paymentCapacity, rMonthly, tgtMonths, minPct, minAbs);
    }

    // Convert financed principal to purchase price where applicable:
    // P = purchase - deposit + fees + (personal initiation)
    const init = loanType === "Personal" ? cleanNum(initiationFeeOnceOff) : 0;
    const purchase = loanType === "Credit Card" ? 0 : Math.max(0, P + cleanNum(deposit) - cleanNum(fees) - init);

    return { maxPayment: paymentCapacity, principalFinanced: Math.max(0, P), purchasePrice: purchase };
  }, [
    income, paymentCapacity, loanType, svcFeeMonthly, rMonthly, nMonths, balloonPct,
    ccMinPct, ccMinAbs, ccTargetMonths, initiationFeeOnceOff, deposit, fees
  ]);

  // ------- Export to PDF (print) -------
  const printRef = useRef(null);
  const exportToPDF = () => {
    const node = printRef.current;
    if (!node) return;

    const printWindow = window.open("", "PRINT", "width=900,height=700");
    if (!printWindow) return;

    const styles = `
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 24px; }
      h1 { font-size: 20px; margin: 0 0 12px; }
      .muted { color: #666; font-size: 12px; margin-bottom: 16px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
      .section { margin-bottom: 16px; }
      @media print { .no-print { display: none !important; } }
    `;

    const now = new Date().toLocaleString();
    const html = `
      <html>
        <head>
          <title>Scend • Loan Summary</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>${styles}</style>
        </head>
        <body>
          <h1>Scend • Loan Summary</h1>
          <div class="muted">Generated on ${now}</div>
          <div class="section">
            ${node.innerHTML}
          </div>
          <div class="muted">Note: Estimates are for planning; lender policies vary.</div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 100);
  };

  const reset = () => {
    setGrossIncome(""); setExistingDebt(""); setCreditAgeYears("5");
    setMissedPayments12m("0"); setInquiries6m("0"); setUtilizationPct("");
    setBasePrimePct("11.75");
    setLoanType("Home");
    setLoanAmount(""); setDeposit(""); setFees("");
    setOverrideRate(false); setRateAnnualPct("");
    setTermYears("20"); setExtraPmt("");
    setBalloonPct("0"); setInitiationFeeOnceOff(""); setMonthlyServiceFee("");
    setCcMinPct("3"); setCcMinAbs("50"); setCcTargetMonths("24");
    setShowSchedule(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Scend • Loan Tool</h1>

      {/* Applicant profile */}
      <div className="border rounded p-4 space-y-3">
        <div className="font-medium">Applicant profile</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <div className="text-sm mb-1">Gross income (per month)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 45,000" value={grossIncome} onChange={(e) => setGrossIncome(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Existing debt payments (per month)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 8,500" value={existingDebt} onChange={(e) => setExistingDebt(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Credit utilization (%)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 25" value={utilizationPct} onChange={(e) => setUtilizationPct(e.target.value)} />
          </label>

          <label className="block">
            <div className="text-sm mb-1">Missed payments (last 12m)</div>
            <input className="border rounded p-2 w-full" placeholder="0" value={missedPayments12m} onChange={(e) => setMissedPayments12m(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm mb-1">
              Credit age (years)
              <span className="block text-xs text-gray-500">≈ time since first account and average age</span>
            </div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 6" value={creditAgeYears} onChange={(e) => setCreditAgeYears(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Inquiries (last 6m)</div>
            <input className="border rounded p-2 w-full" placeholder="0" value={inquiries6m} onChange={(e) => setInquiries6m(e.target.value)} />
          </label>
        </div>
      </div>

      {/* Type & rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Loan type</div>
          <select className="border rounded p-2 w-full" value={loanType} onChange={(e) => setLoanType(e.target.value)}>
            <option>Home</option>
            <option>Vehicle</option>
            <option>Personal</option>
            <option>Credit Card</option>
          </select>
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Base/Prime rate (annual %)</div>
          <input className="border rounded p-2 w-full" placeholder="11.75" value={basePrimePct} onChange={(e) => setBasePrimePct(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Interest rate (annual %)</div>
          <div className="flex gap-2">
            <input className="border rounded p-2 w-full" value={rateAnnualPct} onChange={(e) => setRateAnnualPct(e.target.value)} disabled={!overrideRate} placeholder={autoRate.toFixed(2)} />
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
          <div className="text-sm font-medium mb-1">{loanType === "Credit Card" ? "Card balance / Purchase amount" : "Loan amount / Purchase price"}</div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 1,200,000 / 25,000" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
        </label>

        {loanType !== "Credit Card" && (
          <label className="block">
            <div className="text-sm font-medium mb-1">Deposit (upfront)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 120,000" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
          </label>
        )}

        <label className="block">
          <div className="text-sm font-medium mb-1">
            {loanType === "Home" ? "Bond/Legal fees financed (once-off)"
              : loanType === "Vehicle" ? "On-road/Dealer fees financed (once-off)"
              : loanType === "Credit Card" ? "Once-off fees added" : "Other once-off fees financed"}
          </div>
          <input className="border rounded p-2 w-full" placeholder="e.g. 6,000" value={fees} onChange={(e) => setFees(e.target.value)} />
        </label>

        {loanType === "Vehicle" && (
          <label className="block">
            <div className="text-sm font-medium mb-1">Balloon / Residual (%)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 35" value={balloonPct} onChange={(e) => setBalloonPct(e.target.value)} />
          </label>
        )}

        {loanType === "Personal" && (
          <>
            <label className="block">
              <div className="text-sm font-medium mb-1">Initiation fee (once-off, financed)</div>
              <input className="border rounded p-2 w-full" placeholder="e.g. 1,207" value={initiationFeeOnceOff} onChange={(e) => setInitiationFeeOnceOff(e.target.value)} />
            </label>
            <label className="block">
              <div className="text-sm font-medium mb-1">Monthly service fee</div>
              <input className="border rounded p-2 w-full" placeholder="e.g. 69" value={monthlyServiceFee} onChange={(e) => setMonthlyServiceFee(e.target.value)} />
            </label>
          </>
        )}

        {loanType !== "Credit Card" && (
          <label className="block">
            <div className="text-sm font-medium mb-1">Term (years)</div>
            <input className="border rounded p-2 w-full" placeholder={loanType === "Vehicle" ? "e.g. 6" : loanType === "Personal" ? "e.g. 5" : "e.g. 20"} value={termYears} onChange={(e) => setTermYears(e.target.value)} />
          </label>
        )}

        {loanType === "Credit Card" ? (
          <>
            <label className="block">
              <div className="text-sm font-medium mb-1">Planned payment (per month)</div>
              <input className="border rounded p-2 w-full" placeholder="e.g. 1,200" value={extraPmt} onChange={(e) => setExtraPmt(e.target.value)} />
            </label>
            <div className="grid grid-cols-3 gap-4">
              <label className="block">
                <div className="text-sm font-medium mb-1">Target payoff (months)</div>
                <input className="border rounded p-2 w-full" placeholder="24" value={ccTargetMonths} onChange={(e) => setCcTargetMonths(e.target.value)} />
              </label>
              <label className="block">
                <div className="text-sm font-medium mb-1">Minimum payment %</div>
                <input className="border rounded p-2 w-full" placeholder="3" value={ccMinPct} onChange={(e) => setCcMinPct(e.target.value)} />
              </label>
              <label className="block">
                <div className="text-sm font-medium mb-1">Minimum payment absolute</div>
                <input className="border rounded p-2 w-full" placeholder="50" value={ccMinAbs} onChange={(e) => setCcMinAbs(e.target.value)} />
              </label>
            </div>
          </>
        ) : (
          <label className="block">
            <div className="text-sm font-medium mb-1">Extra payment (per month)</div>
            <input className="border rounded p-2 w-full" placeholder="e.g. 1,000" value={extraPmt} onChange={(e) => setExtraPmt(e.target.value)} />
          </label>
        )}
      </div>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={showSchedule} onChange={(e) => setShowSchedule(e.target.checked)} />
        <span>Show amortisation schedule</span>
      </label>

      {/* Printable Summary */}
      <div ref={printRef} className="mt-4 border rounded p-4 space-y-3">
        <div className="text-lg font-semibold">Summary</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <div>Loan type: <strong>{loanType}</strong></div>
          <div>Estimated credit score: <strong>{score}</strong> (min {minScore} for {loanType})</div>
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

          {/* DTI/PTI */}
          <div>Pre-loan DTI: <strong>{Number.isFinite(preDTI) ? pct(preDTI) : "—"}</strong></div>
          <div>Post-loan DTI: <strong className={dtiOK ? "" : "text-red-600"}>{Number.isFinite(postDTI) ? pct(postDTI) : "—"}</strong> <span className="text-sm text-gray-600"> (limit ~{pct(dtiLimit)})</span></div>
          <div>Payment / Income (PTI): <strong className={ptiOK ? "" : "text-red-600"}>{Number.isFinite(pti) ? pct(pti) : "—"}</strong> <span className="text-sm text-gray-600"> (cap ~{pct(ptiLimit)})</span></div>
        </div>

        {/* Verdict */}
        <div className={`mt-4 border rounded p-3 ${verdictTone}`}>
          <div className="font-semibold">Eligibility: {verdict}</div>
          {hardFails.length > 0 && (
            <ul className="mt-2 list-disc list-inside space-y-1">
              {hardFails.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
          {hardFails.length === 0 && borderline && (
            <div className="mt-2 text-sm">Close! You’re within range but slightly tight on score and/or affordability.</div>
          )}
        </div>

        {/* Recommendations */}
        <div className="mt-3">
          <div className="font-medium mb-1">Recommendations</div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {Number.isFinite(targetMaxPaymentDTI) && (
              <li>To pass DTI for {loanType}, target this loan’s payment ≤ <strong>{ZAR.format(targetMaxPaymentDTI)}</strong> (DTI limit {pct(dtiLimit)}).</li>
            )}
            {Number.isFinite(targetMaxPaymentPTI) && (
              <li>Keep payment ≤ <strong>{ZAR.format(targetMaxPaymentPTI)}</strong> to meet PTI cap {pct(ptiLimit)}.</li>
            )}
            {!scoreOK && (
              <li>Boost credit score: lower utilisation (aim ≤ 30%), avoid new inquiries for a few months, and resolve any late payments. A higher band often reduces your rate.</li>
            )}
            {loanType === "Vehicle" && cleanNum(balloonPct) > 35 && (
              <li>Consider lowering the balloon (≤ 35%) or extending term modestly to reduce monthly strain.</li>
            )}
            {loanType === "Credit Card" && (
              <>
                <li>Your first minimum should be around <strong>{ZAR.format(calc.ccMinPayment)}</strong>. Paying only the minimum prolongs payoff—aim higher.</li>
                <li>To be debt-free in 24 months, pay about <strong>{ZAR.format(ccPay24)}</strong> /month; in 12 months, ~<strong>{ZAR.format(ccPay12)}</strong> /month.</li>
              </>
            )}
            <li>Improve affordability: increase deposit, reduce loan amount, or extend term (within reasonable limits) to bring payment targets into range.</li>
            <li>Rate shopping: even a 0.50% lower APR can noticeably trim your monthly instalment.</li>
          </ul>
        </div>

        {/* Qualification estimate */}
        <div className="mt-5 border rounded p-3 bg-gray-50">
          <div className="font-semibold mb-2">Qualification estimate (if info is truthful)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            <div>Max affordable payment (by DTI/PTI): <strong>{ZAR.format(qual.maxPayment)}</strong></div>
            <div>Estimated APR used: <strong>{rateUsed.toFixed(2)}%</strong></div>
            {loanType !== "Credit Card" && <div>Assumed term: <strong>{nMonths} months</strong></div>}
            {loanType === "Vehicle" && <div>Balloon %: <strong>{cleanNum(balloonPct)}%</strong></div>}
            {loanType === "Personal" && <div>Monthly service fee assumed: <strong>{ZAR.format(svcFeeMonthly)}</strong></div>}
            {loanType === "Credit Card" && <div>Target payoff for estimate: <strong>{Math.max(1, Math.round(cleanNum(ccTargetMonths)||24))} months</strong></div>}
            <div>Max financed principal (estimate): <strong>{ZAR.format(qual.principalFinanced)}</strong></div>
            {loanType !== "Credit Card" && (
              <div>Max purchase price (≈): <strong>{ZAR.format(qual.purchasePrice)}</strong></div>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Uses the stricter of DTI ({pct(dtiLimit)}) and PTI ({pct(ptiLimit)}) caps with your income/debts. Lenders may apply additional checks (employment length, buffers, policies).
          </div>
        </div>

        {showSchedule && calc.schedule.length > 0 && (
          <div className="mt-4">
            <div className="text-md font-medium mb-2">
              Amortisation schedule (first 120 rows{loanType === "Credit Card" ? ", variable min payment" : ""})
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

        {/* Buttons (hidden in print) */}
        <div className="mt-4 flex gap-3 no-print">
          <button className="px-4 py-2 rounded border" onClick={reset}>Clear</button>
          <button className="px-4 py-2 rounded border" onClick={exportToPDF}>Export PDF</button>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Notes: Qualification and eligibility are planning estimates only. Actual lender outcomes vary by policy (buffers, max LTV/LVR, employment/tenure).
        </div>
      </div>
    </div>
  );
}
