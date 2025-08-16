'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { calculateTax, TAX_TABLES, type TaxYearKey } from '../../src/core/tax/taxEngine';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- helpers -------------------------------------------------
function num(v: string) {
  let s = (v ?? '').trim().replace(/\s/g, '');
  if (!s) return 0;
  const hasComma = s.includes(','), hasDot = s.includes('.');
  if (hasComma && hasDot) s = s.replace(/,/g, '');
  else if (hasComma) s = s.replace(/,/g, '.');
  s = s.replace(/[^0-9.-]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

// currency without hydration mismatch
function useCurrency() {
  const [fmt, setFmt] = useState<(n: number) => string>(() => (n: number) => `R ${n.toFixed(2)}`);

  useEffect(() => {
    try {
      const f = new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        currencyDisplay: 'narrowSymbol',
      });
      // also type the param here
      setFmt(() => (x: number) => f.format(x));
    } catch {
      /* ignore */
    }
  }, []);

  return fmt;
}

const CURRENT_TAX_YEAR = (): TaxYearKey => {
  const now = new Date();
  // SA tax year: 1 Mar – 28/29 Feb
  const y = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
  const next = (y + 1).toString().slice(-2);
  return `${y}/${next}` as TaxYearKey;
};

const YEARS: TaxYearKey[] = ['2022/23', '2023/24', '2024/25', '2025/26'];

// ------------------------------------------------------------

export default function TaxPage() {
  const fmtCurrency = useCurrency();
  const [year, setYear] = useState<TaxYearKey>(() => {
    const cur = CURRENT_TAX_YEAR();
    return YEARS.includes(cur) ? cur : '2025/26';
    // falls back safely if our local TAX_TABLES set is smaller
  });

  // Mode
  const [monthlyMode, setMonthlyMode] = useState(false);

  // Inputs (defaults all zero/empty as requested)
  const [baseIncome, setBaseIncome] = useState('0');        // annual or monthly
  const [travelAllowance, setTravelAllowance] = useState('0');
  const [travelMostlyBusiness, setTravelMostlyBusiness] = useState(false);
  const [retirement, setRetirement] = useState('0');
  const [medDeps, setMedDeps] = useState('0');
  const [medMonthly, setMedMonthly] = useState('0');        // monthly amount
  const [medMonths, setMedMonths] = useState('0');          // 0–12
  const [medOOP, setMedOOP] = useState('0');
  const [hasDisability, setHasDisability] = useState(false);
  const [idNum, setIdNum] = useState('');                   // keep empty by default
  const [taxPaidAlready, setTaxPaidAlready] = useState('0'); // annual PAYE already paid

  // Monthly pro-rata (for the current month payroll)
  const [prorataOn, setProrataOn] = useState(false);
  const [daysWorked, setDaysWorked] = useState('0');
  const [daysInMonth, setDaysInMonth] = useState('30');

  // NEW: Annual partial-year factor (months + days for first/last month)
  const [annualPartialOn, setAnnualPartialOn] = useState(false);
  const [monthsWorkedFull, setMonthsWorkedFull] = useState('12'); // full months worked in the tax year
  const [firstDaysWorked, setFirstDaysWorked] = useState('0');
  const [firstDaysInMonth, setFirstDaysInMonth] = useState('30');
  const [lastDaysWorked, setLastDaysWorked] = useState('0');
  const [lastDaysInMonth, setLastDaysInMonth] = useState('30');

  // Results
  const [annualRes, setAnnualRes] = useState<ReturnType<typeof calculateTax> | null>(null);
  const [proRes, setProRes] = useState<ReturnType<typeof calculateTax> | null>(null);

  // PDF ref
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // compute annual partial factor F (0..1)
  const annualFactor = useMemo(() => {
    if (!annualPartialOn) return 1;
    const m = Math.max(0, Math.min(12, Math.floor(num(monthsWorkedFull) || 0)));

    const fdw = Math.max(0, Math.min(31, Math.floor(num(firstDaysWorked) || 0)));
    const fdm = Math.max(1, Math.min(31, Math.floor(num(firstDaysInMonth) || 30)));
    const ldw = Math.max(0, Math.min(31, Math.floor(num(lastDaysWorked) || 0)));
    const ldm = Math.max(1, Math.min(31, Math.floor(num(lastDaysInMonth) || 30)));

    const fraction = m + (fdw > 0 ? fdw / fdm : 0) + (ldw > 0 ? ldw / ldm : 0);
    return Math.max(0, Math.min(1, fraction / 12));
  }, [annualPartialOn, monthsWorkedFull, firstDaysWorked, firstDaysInMonth, lastDaysWorked, lastDaysInMonth]);

  const run = () => {
    const toAnnual = (v: string) => (monthlyMode ? num(v) * 12 : num(v));

    // Start with annualised inputs
    let aBase = toAnnual(baseIncome);
    let aTrav = toAnnual(travelAllowance);
    let aRA = toAnnual(retirement);
    let aOOP = toAnnual(medOOP);

    // Apply annual partial-year factor to remuneration/allowances if enabled
    if (annualPartialOn) {
      aBase *= annualFactor;
      aTrav *= annualFactor;
      aRA *= annualFactor;
      aOOP *= annualFactor;
    }

    const table = TAX_TABLES[year];

    // 1) Annual position
    const annual = calculateTax(
      {
        annualIncome: aBase,
        travelAllowanceAnnual: aTrav,
        travelMostlyBusiness,
        retirementContribAnnual: aRA,

        medDependants: Math.max(0, Math.floor(num(medDeps))),
        medSchemeMonthly: num(medMonthly),
        medMonthsCovered: Math.max(0, Math.min(12, Math.floor(num(medMonths) || 0))),
        medOutOfPocketAnnual: aOOP,
        hasDisability,
        idNumber: idNum,
      },
      table
    );
    setAnnualRes(annual);

    // 2) Monthly pro-rata for a specific month (independent of annual partial year)
    if (prorataOn) {
      const dw = Math.max(0, Math.min(31, Math.floor(num(daysWorked) || 0)));
      const dim = Math.max(1, Math.min(31, Math.floor(num(daysInMonth) || 30)));
      const f = Math.max(0, Math.min(1, dw / dim));

      const pro = calculateTax(
        {
          annualIncome: toAnnual(baseIncome) * f,
          travelAllowanceAnnual: toAnnual(travelAllowance) * f,
          travelMostlyBusiness,
          retirementContribAnnual: toAnnual(retirement) * f,

          medDependants: Math.max(0, Math.floor(num(medDeps))),
          medSchemeMonthly: num(medMonthly), // keep full month MTC
          medMonthsCovered: Math.max(0, Math.min(12, Math.floor(num(medMonths) || 0))),
          medOutOfPocketAnnual: toAnnual(medOOP) * f,
          hasDisability,
          idNumber: idNum,
        },
        table
      );
      setProRes(pro);
    } else {
      setProRes(null);
    }
  };

  const clearAll = () => {
    setMonthlyMode(false);

    setBaseIncome('0');
    setTravelAllowance('0');
    setTravelMostlyBusiness(false);
    setRetirement('0');

    setMedDeps('0');
    setMedMonthly('0');
    setMedMonths('0');
    setMedOOP('0');
    setHasDisability(false);
    setIdNum('');
    setTaxPaidAlready('0');

    setProrataOn(false);
    setDaysWorked('0');
    setDaysInMonth('30');

    setAnnualPartialOn(false);
    setMonthsWorkedFull('12');
    setFirstDaysWorked('0');
    setFirstDaysInMonth('30');
    setLastDaysWorked('0');
    setLastDaysInMonth('30');

    setAnnualRes(null);
    setProRes(null);
  };

  const exportPdf = async () => {
    if (!resultsRef.current) return;
    const node = resultsRef.current;
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' });
    const img = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 64; // margins
    const ratio = imgWidth / canvas.width;
    const imgHeight = canvas.height * ratio;

    pdf.addImage(img, 'PNG', 32, 32, imgWidth, imgHeight);
    pdf.save('scend-tax.pdf');
  };

  // styles
  const accent = '#7f1dff'; // Scend accent
  const pink = '#ff3ea5';

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '20px 16px 40px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>Scend • SARS PAYE</h1>

        {/* card */}
        <div
          style={{
            marginTop: 12,
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 12,
          }}
        >
          {/* Inputs */}
          <div
            style={{
              border: '1px solid #e8e8ee',
              borderRadius: 16,
              padding: 14,
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              background: '#fff',
            }}
          >
            {/* Year + mode */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Tax Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value as TaxYearKey)}
                  style={{
                    width: '100%',
                    border: '1px solid #d6d6e0',
                    borderRadius: 12,
                    padding: '10px 12px',
                  }}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 12 }}>Monthly mode</label>
                <input type="checkbox" checked={monthlyMode} onChange={(e) => setMonthlyMode(e.target.checked)} />
              </div>
            </div>

            {/* Income & allowances */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
                  {monthlyMode ? 'Base Income (per month, excl. travel)' : 'Base Annual Income (excl. travel)'}
                </label>
                <input
                  inputMode="decimal"
                  value={baseIncome}
                  onChange={(e) => setBaseIncome(e.target.value)}
                  placeholder={monthlyMode ? 'e.g. 40000' : 'e.g. 480000'}
                  style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
                  {monthlyMode ? 'Travel Allowance (per month)' : 'Travel Allowance (annual)'}
                </label>
                <input
                  inputMode="decimal"
                  value={travelAllowance}
                  onChange={(e) => setTravelAllowance(e.target.value)}
                  placeholder={monthlyMode ? 'e.g. 8000' : 'e.g. 96000'}
                  style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12 }}>Employer deems ≥80% business use (20% taxable)</span>
                <input
                  type="checkbox"
                  checked={travelMostlyBusiness}
                  onChange={(e) => setTravelMostlyBusiness(e.target.checked)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
                  {monthlyMode ? 'Retirement Contributions (per month)' : 'Retirement Contributions (annual)'}
                </label>
                <input
                  inputMode="decimal"
                  value={retirement}
                  onChange={(e) => setRetirement(e.target.value)}
                  placeholder={monthlyMode ? 'e.g. 5000' : 'e.g. 60000'}
                  style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Tax paid already (annual PAYE)</label>
                <input
                  inputMode="decimal"
                  value={taxPaidAlready}
                  onChange={(e) => setTaxPaidAlready(e.target.value)}
                  placeholder="e.g. 120000"
                  style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                />
              </div>
            </div>

            {/* Medical */}
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Medical Dependants (incl. main)</label>
                <input
                  inputMode="numeric"
                  value={medDeps}
                  onChange={(e) => setMedDeps(e.target.value)}
                  placeholder="e.g. 2"
                  style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Medical Scheme Contribution (per month)</label>
                <input
                  inputMode="decimal"
                  value={medMonthly}
                  onChange={(e) => setMedMonthly(e.target.value)}
                  placeholder="e.g. 3500"
                  style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Months Covered (1–12)</label>
                <input
                  inputMode="numeric"
                  value={medMonths}
                  onChange={(e) => setMedMonths(e.target.value)}
                  placeholder="12"
                  style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
                  {monthlyMode ? 'Medical Out-of-Pocket (per month)' : 'Medical Out-of-Pocket (annual)'}
                </label>
                <input
                  inputMode="decimal"
                  value={medOOP}
                  onChange={(e) => setMedOOP(e.target.value)}
                  placeholder={monthlyMode ? 'e.g. 1000' : 'e.g. 12000'}
                  style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                />
              </div>
            </div>

            {/* Disability + ID */}
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12 }}>Disability (you/spouse/child)</label>
                <input type="checkbox" checked={hasDisability} onChange={(e) => setHasDisability(e.target.checked)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>ID Number (for age rebates)</label>
                <input
                  value={idNum}
                  onChange={(e) => setIdNum(e.target.value)}
                  placeholder="e.g. 9001015800087"
                  style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                />
              </div>
            </div>

            {/* NEW: Annual partial year (months + days) */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong>Partial tax year (annual)</strong>
                <input type="checkbox" checked={annualPartialOn} onChange={(e) => setAnnualPartialOn(e.target.checked)} />
              </div>

              {annualPartialOn && (
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Full months worked (0–12)</label>
                    <input
                      inputMode="numeric"
                      value={monthsWorkedFull}
                      onChange={(e) => setMonthsWorkedFull(e.target.value)}
                      placeholder="e.g. 8"
                      style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#666' }}>
                    Optionally include **days** for the first and/or last month worked:
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>First month: days worked</label>
                    <input
                      inputMode="numeric"
                      value={firstDaysWorked}
                      onChange={(e) => setFirstDaysWorked(e.target.value)}
                      placeholder="e.g. 10"
                      style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>First month: days in month (28–31)</label>
                    <input
                      inputMode="numeric"
                      value={firstDaysInMonth}
                      onChange={(e) => setFirstDaysInMonth(e.target.value)}
                      placeholder="e.g. 31"
                      style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Last month: days worked</label>
                    <input
                      inputMode="numeric"
                      value={lastDaysWorked}
                      onChange={(e) => setLastDaysWorked(e.target.value)}
                      placeholder="e.g. 15"
                      style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Last month: days in month (28–31)</label>
                    <input
                      inputMode="numeric"
                      value={lastDaysInMonth}
                      onChange={(e) => setLastDaysInMonth(e.target.value)}
                      placeholder="e.g. 30"
                      style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#444' }}>
                    Annual factor applied: <strong>{(annualFactor * 100).toFixed(1)}%</strong> of yearly remuneration/allowances.
                  </div>
                </div>
              )}
            </div>

            {/* Monthly pro-rata block */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong>Pro-rata this month (PAYE)</strong>
                <input type="checkbox" checked={prorataOn} onChange={(e) => setProrataOn(e.target.checked)} />
              </div>

              {prorataOn && (
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Days worked this month</label>
                    <input
                      inputMode="numeric"
                      value={daysWorked}
                      onChange={(e) => setDaysWorked(e.target.value)}
                      placeholder="e.g. 15"
                      style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Days in month</label>
                    <input
                      inputMode="numeric"
                      value={daysInMonth}
                      onChange={(e) => setDaysInMonth(e.target.value)}
                      placeholder="e.g. 30"
                      style={{ width: '100%', border: '1px solid #d6d6e0', borderRadius: 12, padding: '10px 12px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                onClick={run}
                style={{
                  background: pink,
                  color: '#fff',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: 14,
                  fontWeight: 700,
                }}
              >
                Calculate {monthlyMode ? '(Monthly estimate)' : ''}
              </button>
              <button
                onClick={exportPdf}
                style={{
                  background: '#222',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: 14,
                  fontWeight: 700,
                }}
              >
                Export PDF
              </button>
              <button
                onClick={clearAll}
                style={{
                  background: '#fff',
                  color: '#111',
                  border: '1px solid #d6d6e0',
                  padding: '12px 16px',
                  borderRadius: 14,
                  fontWeight: 700,
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Results */}
          <div
            ref={resultsRef}
            style={{
              border: '1px solid #e8e8ee',
              borderRadius: 16,
              padding: 14,
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              background: '#fff',
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 8 }}>
              Breakdown ({year}) {annualPartialOn ? '• Annual (partial year applied)' : '• Annual'}
            </h3>

            {annualRes ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                  <div>Taxable Travel Portion (annual)</div>
                  <div style={{ textAlign: 'right' }}>{fmtCurrency(annualRes.travelTaxablePortion)}</div>

                  <div>Income for RA Cap (annual)</div>
                  <div style={{ textAlign: 'right' }}>{fmtCurrency(annualRes.incomeForRA)}</div>

                  <div>Allowed Retirement (annual)</div>
                  <div style={{ textAlign: 'right' }}>{fmtCurrency(annualRes.retirementAllowed)}</div>

                  <div>Taxable Income (annual)</div>
                  <div style={{ textAlign: 'right' }}>{fmtCurrency(annualRes.taxableIncome)}</div>

                  <div>Bracket Tax</div>
                  <div style={{ textAlign: 'right' }}>{fmtCurrency(annualRes.bracketTax)}</div>

                  <div>Rebates</div>
                  <div style={{ textAlign: 'right' }}>
                    {fmtCurrency(annualRes.rebates.total)} (P:{fmtCurrency(annualRes.rebates.primary)}
                    {annualRes.rebates.secondary ? `, S:${fmtCurrency(annualRes.rebates.secondary)}` : ''}
                    {annualRes.rebates.tertiary ? `, T:${fmtCurrency(annualRes.rebates.tertiary)}` : ''})
                  </div>

                  <div>MTC (Annual)</div>
                  <div style={{ textAlign: 'right' }}>{fmtCurrency(annualRes.mtcAnnual)}</div>

                  <div>AMTC (Annual)</div>
                  <div style={{ textAlign: 'right' }}>{fmtCurrency(annualRes.amtcAnnual)}</div>

                  <div style={{ fontWeight: 700 }}>Annual Tax</div>
                  <div style={{ textAlign: 'right', fontWeight: 700 }}>{fmtCurrency(annualRes.annualTax)}</div>
                </div>

                {/* Annual position vs tax paid */}
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 12,
                    background: '#f9f7ff',
                    border: '1px solid #ede8ff',
                  }}
                >
                  {(() => {
                    const paid = num(taxPaidAlready);
                    const diff = paid - annualRes.annualTax;
                    const owing = diff < 0;
                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                        <span>{owing ? 'Amount due to SARS' : 'Estimated refund from SARS'}</span>
                        <span style={{ color: owing ? '#b00020' : '#0a7a2a' }}>{fmtCurrency(Math.abs(diff))}</span>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                  <div>Monthly PAYE (full month basis)</div>
                  <div style={{ textAlign: 'right' }}>{fmtCurrency(annualRes.monthlyPAYE)}</div>
                  <div>Effective rate on taxable</div>
                  <div style={{ textAlign: 'right' }}>{(annualRes.effectiveRateOnTaxable * 100).toFixed(1)}%</div>
                </div>

                {proRes && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 12,
                      background: '#fff7fb',
                      border: '1px solid #ffe3f3',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>This month PAYE (pro-rata)</span>
                      <span>{fmtCurrency(proRes.monthlyPAYE)}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 14, color: '#666' }}>Enter values and hit <strong>Calculate</strong>.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
