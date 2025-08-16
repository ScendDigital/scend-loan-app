import { useMemo, useState } from "react";

/**
 * SARS TABLES (placeholders)
 * Fill these with official values per year:
 *  - brackets: ascending bands with upTo, base, rate (last band has upTo: null)
 *  - rebates: primary, secondary65, tertiary75 (annual)
 *  - mtc: monthly credits { firstTwo, additional }
 */
const TABLES = {
  "2025/26": {
    brackets: [
      // EXAMPLE format (numbers below are PLACEHOLDERS — replace with official values):
      // { upTo: 237100, base: 0, rate: 0.18 },
      // { upTo: 370500, base: 42678, rate: 0.26 },
      // { upTo: 512800, base: 77362, rate: 0.31 },
      // { upTo: 673000, base: 121475, rate: 0.36 },
      // { upTo: 857900, base: 179147, rate: 0.39 },
      // { upTo: 1817000, base: 251258, rate: 0.41 },
      // { upTo: null, base: 644489, rate: 0.45 },
    ],
    rebates: {
      primary: 0,       // TODO
      secondary65: 0,   // TODO
      tertiary75: 0,    // TODO
    },
    mtc: {
      // Medical Scheme Fees Tax Credit — monthly
      firstTwo: 364,     // main + first dependent (per month) — confirm for 2025/26
      additional: 246,   // each additional dependent (per month) — confirm for 2025/26
    },
  },
  "2024/25": {
    brackets: [
      // TODO: paste the official 2024/25 bands here
    ],
    rebates: {
      primary: 0,       // TODO: e.g. 17235 (confirm officially)
      secondary65: 0,   // TODO: e.g. 9444  (confirm officially)
      tertiary75: 0,    // TODO: e.g. 3145  (confirm officially)
    },
    mtc: {
      firstTwo: 364,
      additional: 246,
    },
  },
};

function inferAgeFromSAID(id) {
  if (!/^\d{13}$/.test(id)) return null;
  const yy = parseInt(id.slice(0, 2), 10);
  const mm = parseInt(id.slice(2, 4), 10) - 1;
  const dd = parseInt(id.slice(4, 6), 10);
  const now = new Date();
  const curYY = now.getFullYear() % 100;
  const century = yy <= curYY ? 2000 : 1900;
  const dob = new Date(century + yy, mm, dd);
  if (Number.isNaN(dob.getTime())) return null;
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function parseMoney(v) {
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function applyAnnualBrackets(brackets, taxable) {
  if (!brackets?.length || taxable <= 0) return 0;

  // We’ll compute tax using the “base + marginal” shape defined on the band where taxable falls.
  for (let i = 0; i < brackets.length; i++) {
    const band = brackets[i];
    const prevCap = i === 0 ? 0 : brackets[i - 1].upTo;
    const isLast = band.upTo == null;
    if (isLast || taxable <= band.upTo) {
      const over = taxable - (prevCap ?? 0);
      const tax = (band.base ?? 0) + Math.max(0, over) * (band.rate ?? 0);
      return Math.max(0, tax);
    }
  }
  return 0;
}

export default function TaxTool() {
  // UI state
  const [year, setYear] = useState("2025/26");
  const [monthlyMode, setMonthlyMode] = useState(true);

  const [baseAnnual, setBaseAnnual] = useState("");
  const [travelAnnual, setTravelAnnual] = useState("");
  const [deem80Business, setDeem80Business] = useState(false);

  const [retirementAnnual, setRetirementAnnual] = useState("");
  const [taxPaidAlreadyAnnual, setTaxPaidAlreadyAnnual] = useState("");

  const [dependants, setDependants] = useState(""); // total members incl. main
  const [medMonthly, setMedMonthly] = useState("");
  const [monthsCovered, setMonthsCovered] = useState("12");
  const [medOutOfPocketAnnual, setMedOutOfPocketAnnual] = useState("");
  const [disability, setDisability] = useState(false);

  const [idNumber, setIdNumber] = useState("");
  const [partialTaxYear, setPartialTaxYear] = useState(false);
  const [proRataThisMonth, setProRataThisMonth] = useState(false);

  const T = TABLES[year];

  const results = useMemo(() => {
    const base = parseMoney(baseAnnual);
    const travel = parseMoney(travelAnnual);
    const ra = parseMoney(retirementAnnual);
    const paid = parseMoney(taxPaidAlreadyAnnual);

    const depCount = Math.max(0, parseInt(dependants || "0", 10));
    const medPMonth = parseMoney(medMonthly);
    const months = Math.min(12, Math.max(0, parseInt(monthsCovered || "12", 10)));
    const oop = parseMoney(medOutOfPocketAnnual);
    const age = inferAgeFromSAID(idNumber);

    // 1) Travel PAYE inclusion (80% default; 20% if employer deems ≥80% business use)
    const taxableTravel = travel * (deem80Business ? 0.2 : 0.8);

    // 2) Remuneration (simplified; hook here if you add more components)
    const remuneration = base + taxableTravel;

    // 3) Retirement cap: min( RA, 27.5% * max(remuneration, taxableBase), R350k )
    // Using remuneration as base for simplicity; you can adapt if you add other income items.
    const retCap = Math.min(ra, 0.275 * Math.max(remuneration, remuneration), 350000);

    // 4) Taxable income
    const taxableIncome = Math.max(0, remuneration - retCap);

    // 5) Annual tax before rebates using brackets
    const grossAnnualTax = applyAnnualBrackets(T.brackets, taxableIncome);

    // 6) Age rebates
    let rebate = T.rebates.primary || 0;
    if (age != null && age >= 65) rebate += T.rebates.secondary65 || 0;
    if (age != null && age >= 75) rebate += T.rebates.tertiary75 || 0;
    const afterRebates = Math.max(0, grossAnnualTax - rebate);

    // 7) Medical Tax Credits
    const mtcPerMonth =
      (depCount >= 1 ? T.mtc.firstTwo : 0) +
      (depCount >= 2 ? T.mtc.firstTwo : 0) +
      Math.max(0, depCount - 2) * T.mtc.additional;

    const MTC_total = mtcPerMonth * months;
    const medContribAnnual = medPMonth * months;

    // AMTC (section 6B)
    const enhanced = (age != null && age >= 65) || disability;
    const multiplier = enhanced ? 3 : 4;      // multiple of MTC for contribution threshold
    const rate = enhanced ? 0.333 : 0.25;     // 33.3% vs 25%

    const mtcAnnualEquivalent = mtcPerMonth * months;
    const excessContrib = Math.max(0, medContribAnnual - multiplier * mtcAnnualEquivalent);
    const AMTC = rate * (oop + excessContrib);

    const annualAfterCredits = Math.max(0, afterRebates - (MTC_total + AMTC));

    // 8) Monthly presentation
    const steadyMonthlyPAYE = Math.max(
      0,
      (afterRebates / 12) - mtcPerMonth - (AMTC / 12)
    );

    // 9) Balance vs PAYE already paid (annual)
    const balanceDue = annualAfterCredits - paid;

    // Optional “pro-rata this month” view (cumulative approach)
    let thisMonthPAYE = steadyMonthlyPAYE;
    if (monthlyMode && proRataThisMonth && months > 0 && months <= 12) {
      // crude cumulative approach: distribute annualAfterCredits over monthsWorked, then subtract PAYE already paid
      const cumulativeDue = annualAfterCredits * (months / 12);
      const alreadyWithheld = Math.min(paid, cumulativeDue);
      thisMonthPAYE = Math.max(0, cumulativeDue - alreadyWithheld);
    }

    return {
      age,
      remuneration,
      taxableIncome,
      grossAnnualTax,
      rebate,
      mtcPerMonth,
      MTC_total,
      AMTC,
      afterRebates,
      annualAfterCredits,
      steadyMonthlyPAYE,
      thisMonthPAYE,
      balanceDue,
      months,
    };
  }, [
    year, baseAnnual, travelAnnual, deem80Business, retirementAnnual,
    taxPaidAlreadyAnnual, dependants, medMonthly, monthsCovered,
    medOutOfPocketAnnual, disability, idNumber, monthlyMode, proRataThisMonth, T
  ]);

  const currency = (n) =>
    `R ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Scend • SARS PAYE</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <label className="grid gap-1">
          <span className="text-sm">Tax Year</span>
          <select
            className="border rounded px-3 py-2"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option>2025/26</option>
            <option>2024/25</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Mode</span>
          <select
            className="border rounded px-3 py-2"
            value={monthlyMode ? "monthly" : "annual"}
            onChange={(e) => setMonthlyMode(e.target.value === "monthly")}
          >
            <option value="monthly">Monthly mode</option>
            <option value="annual">Annual mode</option>
          </select>
        </label>

        <label className="flex items-center gap-2 mt-6 md:mt-0">
          <input
            type="checkbox"
            checked={proRataThisMonth}
            onChange={(e) => setProRataThisMonth(e.target.checked)}
          />
          <span className="text-sm">Pro-rata this month (PAYE)</span>
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <label className="grid gap-1">
          <span>Base Annual Income (excl. travel)</span>
          <input className="border rounded px-3 py-2"
                 value={baseAnnual}
                 onChange={(e) => setBaseAnnual(e.target.value)}
                 placeholder="e.g. 350000" />
        </label>

        <div className="grid gap-2">
          <label className="grid gap-1">
            <span>Travel Allowance (annual)</span>
            <input className="border rounded px-3 py-2"
                   value={travelAnnual}
                   onChange={(e) => setTravelAnnual(e.target.value)}
                   placeholder="e.g. 60000" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox"
                   checked={deem80Business}
                   onChange={(e) => setDeem80Business(e.target.checked)} />
            <span className="text-sm">Employer deems ≥80% business use (20% taxable)</span>
          </label>
        </div>

        <label className="grid gap-1">
          <span>Retirement Contributions (annual)</span>
          <input className="border rounded px-3 py-2"
                 value={retirementAnnual}
                 onChange={(e) => setRetirementAnnual(e.target.value)}
                 placeholder="e.g. 50000" />
        </label>

        <label className="grid gap-1">
          <span>Tax paid already (annual PAYE)</span>
          <input className="border rounded px-3 py-2"
                 value={taxPaidAlreadyAnnual}
                 onChange={(e) => setTaxPaidAlreadyAnnual(e.target.value)}
                 placeholder="e.g. 45000" />
        </label>

        <label className="grid gap-1">
          <span>Medical Dependants (incl. main)</span>
          <input className="border rounded px-3 py-2"
                 type="number" min="0"
                 value={dependants}
                 onChange={(e) => setDependants(e.target.value)} />
        </label>

        <div className="grid gap-2">
          <label className="grid gap-1">
            <span>Medical Scheme Contribution (per month)</span>
            <input className="border rounded px-3 py-2"
                   value={medMonthly}
                   onChange={(e) => setMedMonthly(e.target.value)}
                   placeholder="e.g. 3500" />
          </label>
          <label className="grid gap-1">
            <span>Months Covered (1–12)</span>
            <input className="border rounded px-3 py-2"
                   type="number" min="0" max="12"
                   value={monthsCovered}
                   onChange={(e) => setMonthsCovered(e.target.value)} />
          </label>
        </div>

        <label className="grid gap-1">
          <span>Medical Out-of-Pocket (annual)</span>
          <input className="border rounded px-3 py-2"
                 value={medOutOfPocketAnnual}
                 onChange={(e) => setMedOutOfPocketAnnual(e.target.value)}
                 placeholder="e.g. 12000" />
        </label>

        <label className="grid gap-1">
          <span>ID Number (for age rebates)</span>
          <input className="border rounded px-3 py-2"
                 value={idNumber}
                 onChange={(e) => setIdNumber(e.target.value)}
                 placeholder="e.g. 9001015800087" />
        </label>

        <div className="grid gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox"
                   checked={disability}
                   onChange={(e) => setDisability(e.target.checked)} />
            <span className="text-sm">Disability (you/spouse/child)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox"
                   checked={partialTaxYear}
                   onChange={(e) => setPartialTaxYear(e.target.checked)} />
            <span className="text-sm">Partial tax year (annual)</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          className="px-4 py-2 rounded-xl border"
          onClick={() => {
            // no-op: calculations are reactive; keep button for UX parity
          }}
        >
          Calculate
        </button>
        {/* Hook up PDF export later if desired */}
        <button
          className="px-4 py-2 rounded-xl border"
          onClick={() => alert("PDF export coming soon")}
        >
          Export PDF
        </button>
        <button
          className="px-4 py-2 rounded-xl border"
          onClick={() => {
            setBaseAnnual("");
            setTravelAnnual("");
            setDeem80Business(false);
            setRetirementAnnual("");
            setTaxPaidAlreadyAnnual("");
            setDependants("");
            setMedMonthly("");
            setMonthsCovered("12");
            setMedOutOfPocketAnnual("");
            setDisability(false);
            setIdNumber("");
            setPartialTaxYear(false);
            setProRataThisMonth(false);
          }}
        >
          Clear
        </button>
      </div>

      <div className="p-4 rounded-xl border">
        <h2 className="text-lg font-semibold mb-2">
          Breakdown ({year}) • {monthlyMode ? "Monthly" : "Annual"}
        </h2>
        <div className="grid md:grid-cols-2 gap-y-1">
          <div>Age (from ID): <strong>{results.age ?? "—"}</strong></div>
          <div>Months covered: <strong>{results.months}</strong></div>
          <div>Remuneration: <strong>{currency(results.remuneration)}</strong></div>
          <div>Taxable income: <strong>{currency(results.taxableIncome)}</strong></div>
          <div>Annual tax (before rebates): <strong>{currency(results.grossAnnualTax)}</strong></div>
          <div>Age rebates (total): <strong>{currency(results.rebate)}</strong></div>
          <div>After rebates (annual): <strong>{currency(results.afterRebates)}</strong></div>
          <div>MTC (monthly): <strong>{currency(results.mtcPerMonth)}</strong></div>
          <div>MTC total (annual): <strong>{currency(results.MTC_total)}</strong></div>
          <div>AMTC (annual): <strong>{currency(results.AMTC)}</strong></div>
          <div className="col-span-2">
            Annual tax after credits: <strong>{currency(results.annualAfterCredits)}</strong>
          </div>

          {monthlyMode ? (
            <>
              <div className="col-span-2 text-emerald-700 mt-2">
                Steady-state PAYE per month: <strong>{currency(results.steadyMonthlyPAYE)}</strong>
              </div>
              {proRataThisMonth && (
                <div className="col-span-2">
                  Pro-rata this month (cumulative): <strong>{currency(results.thisMonthPAYE)}</strong>
                </div>
              )}
            </>
          ) : null}

          <div className="col-span-2 mt-2">
            Balance due / (refund) vs PAYE already paid:{" "}
            <strong>{currency(results.balanceDue)}</strong>
          </div>
        </div>

        <p className="text-xs opacity-60 mt-3">
          Notes: Travel allowance included at {deem80Business ? "20%" : "80%"} for PAYE. Retirement deduction cap = min(RA, 27.5% of remuneration, R350,000).
          Apply official SARS {year} brackets/rebates; update TABLES above when published.
        </p>
      </div>
    </div>
  );
}
