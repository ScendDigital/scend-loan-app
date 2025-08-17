// web/src/lib/tax/calc.ts

export type TaxYear = "2024/25" | "2025/26";

const TABLES = {
  "2024/25": { asOf: new Date(Date.UTC(2025, 1, 28)), daysInYear: 365 },
  "2025/26": { asOf: new Date(Date.UTC(2026, 1, 28)), daysInYear: 365 },
} as const;

// SARS brackets/rebates/credits (unchanged across 2024/25 and 2025/26)
const BRACKETS = [
  { limit: 237_100,   base: 0,       rate: 0.18,  thresh: 0 },
  { limit: 370_500,   base: 42_678,  rate: 0.26,  thresh: 237_100 },
  { limit: 512_800,   base: 77_362,  rate: 0.31,  thresh: 370_500 },
  { limit: 673_000,   base: 121_475, rate: 0.36,  thresh: 512_800 },
  { limit: 857_900,   base: 179_147, rate: 0.39,  thresh: 673_000 },
  { limit: 1_817_000, base: 251_258, rate: 0.41,  thresh: 857_900 },
  { limit: Infinity,  base: 644_489, rate: 0.45,  thresh: 1_817_000 },
];
const REBATES = { primary: 17_235, secondary: 9_444, tertiary: 3_145 };
const MTC_MAIN = 364, MTC_FIRST_DEP = 364, MTC_ADDL_DEP = 246;

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

function ageFromSouthAfricanID(id: string, asOf: Date): number {
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

function mtcPerMonth(dependants: number): number {
  const firstTwo = Math.min(dependants, 2);
  const addl = Math.max(0, dependants - 2);
  return (firstTwo >= 1 ? MTC_MAIN : 0) + (firstTwo >= 2 ? MTC_FIRST_DEP : 0) + addl * MTC_ADDL_DEP;
}

function annualAMTC(params: {
  age: number;
  disabled: boolean;
  taxableIncome: number;
  medContribAnnual: number;
  mtcAnnual: number;
  medOutOfPocketAnnual: number;
}) {
  const { age, disabled, taxableIncome, medContribAnnual, mtcAnnual, medOutOfPocketAnnual } = params;
  if (disabled || age >= 65) {
    const excess = Math.max(0, medContribAnnual - 3 * mtcAnnual);
    return (1 / 3) * (medOutOfPocketAnnual + excess);
  } else {
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

export function calculateAnnualPAYE(input: {
  taxYear?: TaxYear;                // "2024/25" (default) or "2025/26"
  baseAnnualIncome: number;         // excl. travel (ANNUAL)
  travelAllowanceAnnual: number;    // ANNUAL
  deem80BusinessUse: boolean;       // true => 20% PAYE inclusion
  retirementContribAnnual: number;  // ANNUAL
  medDependants: number;            // incl. main member
  medContributionMonthly: number;   // per month
  monthsCovered: number;            // 1–12 (MTC/AMTC use)
  medOutOfPocketAnnual: number;     // qualifying OOP (ANNUAL)
  idNumber?: string;
  disabled?: boolean;

  // Day-based pro-rata (annual)
  partialYearByDays?: boolean;
  yearDaysWorked?: number;
  yearDaysInYear?: number;

  // Day-based pro-rata (monthly)
  prorataMonthByDays?: boolean;
  monthWorkedDays?: number;
  monthDaysInPeriod?: number;
}) {
  const year: TaxYear = input.taxYear ?? "2024/25";
  const asOf = TABLES[year].asOf;
  const daysInYear = input.yearDaysInYear ?? TABLES[year].daysInYear;

  const idProvided = !!input.idNumber && input.idNumber.length >= 6;
  const age = idProvided ? ageFromSouthAfricanID(input.idNumber!, asOf) : 0;

  // Bases
  const travelPAYEIncl = (input.deem80BusinessUse ? 0.20 : 0.80) * (input.travelAllowanceAnnual || 0);
  const remunerationPAYE = input.baseAnnualIncome + travelPAYEIncl;                     // monthly PAYE basis
  const remunerationAnnual = input.baseAnnualIncome + (input.travelAllowanceAnnual || 0); // annual assessment basis

  // Retirement deduction & taxable income
  const raAllowed = allowedRetirementDeduction(remunerationAnnual, input.retirementContribAnnual || 0);
  const taxableIncome = Math.max(0, remunerationAnnual - raAllowed);

  // Tax ladder
  const taxBR = taxBeforeRebates(taxableIncome);

  // Rebates (primary always; 65+/75+ only if we have an ID to infer age)
  const rebates =
    REBATES.primary +
    (idProvided ? (age >= 65 ? REBATES.secondary : 0) + (age >= 75 ? REBATES.tertiary : 0) : 0);

  const taxAfterRebates = Math.max(0, taxBR - rebates);

  // Medical credits (month-based per SARS)
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

  // After credits (full annual)
  const taxAfterCredits = Math.max(0, taxAfterRebates - mtcAnnual - amtc);

  // ---- Monthly baselines ----
  // Employers generally exclude AMTC from PAYE; expose both for the UI.
  const monthlyPAYE_with_AMTC = taxAfterCredits / 12;
  const monthlyPAYE_without_AMTC = Math.max(0, (taxAfterRebates - mtcAnnual) / 12);

  // ---- Pro-rata: Annual (by days) ----
  let annualProrationFactorDays = 1;
  let annualTaxProratedDays = taxAfterCredits;
  if (input.partialYearByDays) {
    const worked = clamp(input.yearDaysWorked ?? 0, 0, daysInYear);
    annualProrationFactorDays = daysInYear > 0 ? worked / daysInYear : 0;
    annualTaxProratedDays = taxAfterCredits * annualProrationFactorDays;
  }

  // ---- Pro-rata: This month (by days) ----
  let monthProrationPctDays = 1;
  let monthlyPAYEProrataDays = monthlyPAYE_with_AMTC;
  let monthlyPAYEProrataDaysNoAMTC = monthlyPAYE_without_AMTC;
  if (input.prorataMonthByDays) {
    const dWorked = clamp(input.monthWorkedDays ?? 0, 0, 366);
    const dPeriod = clamp(input.monthDaysInPeriod ?? 0, 0, 366);
    monthProrationPctDays = dPeriod > 0 ? dWorked / dPeriod : 0;
    monthlyPAYEProrataDays = monthlyPAYE_with_AMTC * monthProrationPctDays;
    monthlyPAYEProrataDaysNoAMTC = monthlyPAYE_without_AMTC * monthProrationPctDays;
  }

  const rebateNote = idProvided
    ? null
    : "No ID provided: only the primary rebate applied. Add an ID to unlock 65+/75+ age rebates.";

  return {
    // inputs resolved
    taxYear: year,
    idProvided,
    rebateNote,
    age,
    monthsCovered: months,

    // bases
    remunerationPAYE,
    remunerationAnnual,

    // tax ladder
    taxableIncome,
    taxBeforeRebates: taxBR,
    rebates,
    taxAfterRebates,
    mtcMonthly,
    mtcAnnual,
    amtc,
    taxAfterCredits,

    // annual pro-rata (days)
    annualTaxProratedDays,
    annualProrationFactorDays,

    // monthly baselines & day pro-rata
    monthlyPAYE_with_AMTC,
    monthlyPAYE_without_AMTC,
    monthlyPAYEProrataDays,
    monthlyPAYEProrataDaysNoAMTC,
    monthProrationPctDays,
  };
}
