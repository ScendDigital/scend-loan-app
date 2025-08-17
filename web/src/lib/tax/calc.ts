// web/src/lib/tax/calc.ts

// ===== Supported tax years =====
export type TaxYear = "2024/25" | "2025/26";

// As-of date for age rebates (last day of the tax year)
const TABLES = {
  "2024/25": { asOf: new Date(Date.UTC(2025, 1, 28)) }, // 28 Feb 2025
  "2025/26": { asOf: new Date(Date.UTC(2026, 1, 28)) }, // 28 Feb 2026
} as const;

// ===== SARS 2024/25 (unchanged for 2025/26) =====
// Personal income tax brackets
const BRACKETS = [
  { limit: 237_100,   base: 0,       rate: 0.18,  thresh: 0 },
  { limit: 370_500,   base: 42_678,  rate: 0.26,  thresh: 237_100 },
  { limit: 512_800,   base: 77_362,  rate: 0.31,  thresh: 370_500 },
  { limit: 673_000,   base: 121_475, rate: 0.36,  thresh: 512_800 },
  { limit: 857_900,   base: 179_147, rate: 0.39,  thresh: 673_000 },
  { limit: 1_817_000, base: 251_258, rate: 0.41,  thresh: 857_900 },
  { limit: Infinity,  base: 644_489, rate: 0.45,  thresh: 1_817_000 },
];

// Primary/Secondary/Tertiary rebates
const REBATES = { primary: 17_235, secondary: 9_444, tertiary: 3_145 };

// Medical Scheme Fee Tax Credits (per month)
const MTC_MAIN = 364;      // taxpayer
const MTC_FIRST_DEP = 364; // first dependant
const MTC_ADDL_DEP = 246;  // each additional dependant

// ===== Helpers =====
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function ageFromSouthAfricanID(id: string, asOf: Date): number {
  // YYMMDD…… -> Age at asOf date
  const yy = parseInt(id.slice(0, 2), 10);
  const mm = parseInt(id.slice(2, 4), 10) - 1;
  const dd = parseInt(id.slice(4, 6), 10);
  const year = yy <= 25 ? 2000 + yy : 1900 + yy;
  const dob = new Date(Date.UTC(year, mm, dd));
  let age = asOf.getUTCFullYear() - dob.getUTCFullYear();
  const m = asOf.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && asOf.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

function taxBeforeRebates(taxable: number): number {
  const b = BRACKETS.find(br => taxable <= br.limit)!;
  return b.base + b.rate * (taxable - b.thresh);
}

function rebatesForAge(age: number): number {
  let r = REBATES.primary;
  if (age >= 65) r += REBATES.secondary;
  if (age >= 75) r += REBATES.tertiary;
  return r;
}

function mtcPerMonth(dependants: number): number {
  const firstTwo = Math.min(dependants, 2);
  const addl = Math.max(0, dependants - 2);
  return (
    (firstTwo >= 1 ? MTC_MAIN : 0) +
    (firstTwo >= 2 ? MTC_FIRST_DEP : 0) +
    addl * MTC_ADDL_DEP
  );
}

function annualMTC(months: number, dependants: number): number {
  const monthsUsed = clamp(months || 0, 0, 12);
  return mtcPerMonth(dependants) * monthsUsed;
}

function annualAMTC(params: {
  age: number;
  disabled: boolean;
  taxableIncome: number;        // before credits
  medContribAnnual: number;     // employee-paid contributions
  mtcAnnual: number;
  medOutOfPocketAnnual: number; // qualifying OOP
}) {
  const { age, disabled, taxableIncome, medContribAnnual, mtcAnnual, medOutOfPocketAnnual } = params;

  if (disabled || age >= 65) {
    // 33.3% × (qualifying + (contrib - 3×MTC))
    const excess = Math.max(0, medContribAnnual - 3 * mtcAnnual);
    return (1 / 3) * (medOutOfPocketAnnual + excess);
  } else {
    // 25% × [(qualifying + (contrib - 4×MTC)) - 7.5% of taxable]
    const excess = Math.max(0, medContribAnnual - 4 * mtcAnnual);
    const base = medOutOfPocketAnnual + excess;
    const threshold = 0.075 * taxableIncome;
    return 0.25 * Math.max(0, base - threshold);
  }
}

function allowedRetirementDeduction(remunerationAnnual: number, contributedAnnual: number): number {
  const cap27_5 = 0.275 * remunerationAnnual;
  return Math.min(contributedAnnual, cap27_5, 350_000);
}

// ===== Main calculator =====
export function calculateAnnualPAYE(input: {
  taxYear?: TaxYear;                // "2024/25" (default) or "2025/26"
  baseAnnualIncome: number;         // excl. travel
  travelAllowanceAnnual: number;    // annual travel allowance
  deem80BusinessUse: boolean;       // true => 20% PAYE inclusion
  retirementContribAnnual: number;  // total contributions considered
  medDependants: number;            // incl. main member
  medContributionMonthly: number;   // employee contribution per month
  monthsCovered: number;            // 1–12
  medOutOfPocketAnnual: number;     // qualifying OOP
  idNumber?: string;
  disabled?: boolean;
}) {
  const year: TaxYear = input.taxYear ?? "2024/25";
  const asOf = TABLES[year].asOf;

  const age = input.idNumber ? ageFromSouthAfricanID(input.idNumber, asOf) : 0;

  // PAYE remuneration basis (for monthly PAYE calc)
  const travelPAYEIncl = (input.deem80BusinessUse ? 0.20 : 0.80) * (input.travelAllowanceAnnual || 0);
  const remunerationPAYE = input.baseAnnualIncome + travelPAYEIncl;

  // Assessment remuneration (conservative: full travel; logbook claims later on ITR12)
  const remunerationAnnual = input.baseAnnualIncome + (input.travelAllowanceAnnual || 0);

  // Retirement deduction
  const raAllowed = allowedRetirementDeduction(remunerationAnnual, input.retirementContribAnnual || 0);

  // Taxable income
  const taxableIncome = Math.max(0, remunerationAnnual - raAllowed);

  // Tax before rebates and credits
  const taxBR = taxBeforeRebates(taxableIncome);

  // Age rebates
  const rebates = rebatesForAge(age);
  const taxAfterRebates = Math.max(0, taxBR - rebates);

  // Medical credits
  const months = clamp(input.monthsCovered || 0, 0, 12);
  const mtcMonthly = mtcPerMonth(input.medDependants || 0);
  const mtcAnnual = mtcMonthly * months;

  const medContribAnnual = (input.medContributionMonthly || 0) * months;
  const amtc = annualAMTC({
    age,
    disabled: !!input.disabled,
    taxableIncome,
    medContribAnnual,
    mtcAnnual,
    medOutOfPocketAnnual: input.medOutOfPocketAnnual || 0,
  });

  const taxAfterCredits = Math.max(0, taxAfterRebates - mtcAnnual - amtc);

  return {
    // inputs resolved
    taxYear: year,
    age,
    monthsCovered: months,

    // bases
    remunerationPAYE,
    remunerationAnnual,
    taxableIncome,

    // tax ladder
    taxBeforeRebates: taxBR,
    rebates,
    taxAfterRebates,
    mtcMonthly,
    mtcAnnual,
    amtc,
    taxAfterCredits,

    // convenience
    monthlyPAYEApprox: taxAfterCredits / 12,
  };
}
