// src/core/taxEngine.ts
import { ageFromSouthAfricanID } from "./utils";

/** Selectable tax years */
export type TaxYearKey = "2022/23" | "2023/24" | "2024/25" | "2025/26";

export interface TaxInput {
  annualIncome: number;                // base remuneration (excl. travel allowance)
  idNumber?: string;
  explicitAge?: number;

  medDependants: number;
  medSchemeMonthly?: number;
  medMonthsCovered?: number;           // 0..12
  medOutOfPocketAnnual?: number;
  hasDisability?: boolean;

  retirementContribAnnual?: number;

  // Travel allowance (PAYE inclusion rule)
  travelAllowanceAnnual?: number;
  travelMostlyBusiness?: boolean;      // if true => 20% taxable, else 80%
}

export interface TaxTable {
  label: TaxYearKey;
  brackets: { upTo: number; base: number; rate: number; prev: number }[];
  rebates: { primary: number; secondary: number; tertiary: number };
  mtc: { firstTwo: number; additional: number }; // monthly credits
  raCapPercent: number;   // 27.5%
  raCapAbsolute: number;  // R350,000
}

/** Year tables (2025/26 matches 2024/25 until you update with final figures) */
export const TAX_TABLES: Record<TaxYearKey, TaxTable> = {
  "2022/23": {
    label: "2022/23",
    brackets: [
      { upTo: 226_000, base: 0,      rate: 0.18, prev: 0 },
      { upTo: 353_100, base: 40_680, rate: 0.26, prev: 226_000 },
      { upTo: 488_700, base: 73_726, rate: 0.31, prev: 353_100 },
      { upTo: 641_400, base:115_762, rate: 0.36, prev: 488_700 },
      { upTo: 817_600, base:170_734, rate: 0.39, prev: 641_400 },
      { upTo:1_731_600, base:239_452, rate: 0.41, prev: 817_600 },
      { upTo: Number.POSITIVE_INFINITY, base:614_192, rate: 0.45, prev: 1_731_600 }
    ],
    rebates: { primary: 16_425, secondary: 9_000, tertiary: 2_997 },
    mtc: { firstTwo: 347, additional: 234 },
    raCapPercent: 0.275,
    raCapAbsolute: 350_000
  },
  "2023/24": {
    label: "2023/24",
    brackets: [
      { upTo: 237_100, base: 0,      rate: 0.18, prev: 0 },
      { upTo: 370_500, base: 42_678, rate: 0.26, prev: 237_100 },
      { upTo: 512_800, base: 77_362, rate: 0.31, prev: 370_500 },
      { upTo: 673_000, base:121_475, rate: 0.36, prev: 512_800 },
      { upTo: 857_900, base:179_147, rate: 0.39, prev: 673_000 },
      { upTo:1_817_000, base:251_258, rate: 0.41, prev: 857_900 },
      { upTo: Number.POSITIVE_INFINITY, base:644_489, rate: 0.45, prev: 1_817_000 }
    ],
    rebates: { primary: 17_235, secondary: 9_444, tertiary: 3_145 },
    mtc: { firstTwo: 364, additional: 246 },
    raCapPercent: 0.275,
    raCapAbsolute: 350_000
  },
  "2024/25": {
    label: "2024/25",
    brackets: [
      { upTo: 237_100, base: 0,      rate: 0.18, prev: 0 },
      { upTo: 370_500, base: 42_678, rate: 0.26, prev: 237_100 },
      { upTo: 512_800, base: 77_362, rate: 0.31, prev: 370_500 },
      { upTo: 673_000, base:121_475, rate: 0.36, prev: 512_800 },
      { upTo: 857_900, base:179_147, rate: 0.39, prev: 673_000 },
      { upTo:1_817_000, base:251_258, rate: 0.41, prev: 857_900 },
      { upTo: Number.POSITIVE_INFINITY, base:644_489, rate: 0.45, prev: 1_817_000 }
    ],
    rebates: { primary: 17_235, secondary: 9_444, tertiary: 3_145 },
    mtc: { firstTwo: 364, additional: 246 },
    raCapPercent: 0.275,
    raCapAbsolute: 350_000
  },
  "2025/26": {
    // TODO: replace with final 2025/26 amounts when ready
    label: "2025/26",
    brackets: [
      { upTo: 237_100, base: 0,      rate: 0.18, prev: 0 },
      { upTo: 370_500, base: 42_678, rate: 0.26, prev: 237_100 },
      { upTo: 512_800, base: 77_362, rate: 0.31, prev: 370_500 },
      { upTo: 673_000, base:121_475, rate: 0.36, prev: 512_800 },
      { upTo: 857_900, base:179_147, rate: 0.39, prev: 673_000 },
      { upTo:1_817_000, base:251_258, rate: 0.41, prev: 857_900 },
      { upTo: Number.POSITIVE_INFINITY, base:644_489, rate: 0.45, prev: 1_817_000 }
    ],
    rebates: { primary: 17_235, secondary: 9_444, tertiary: 3_145 },
    mtc: { firstTwo: 364, additional: 246 },
    raCapPercent: 0.275,
    raCapAbsolute: 350_000
  }
};

function bracketTax(taxable: number, table: TaxTable) {
  const b = table.brackets.find(x => taxable <= x.upTo)!;
  return b.base + (taxable - b.prev) * b.rate;
}

function mtcMonthlyForFamily(depCount: number, table: TaxTable) {
  const d = Math.max(0, Math.floor(depCount || 0));
  if (d <= 0) return 0;
  if (d === 1) return table.mtc.firstTwo;
  if (d === 2) return table.mtc.firstTwo * 2;
  return table.mtc.firstTwo * 2 + (d - 2) * table.mtc.additional;
}

function clampMonths(m?: number) {
  const x = Math.floor(m ?? 12);
  return Math.min(12, Math.max(0, x));
}

function allowedRetirement(baseForCap: number, contrib: number | undefined, table: TaxTable) {
  const c = Math.max(0, contrib || 0);
  const capByPercent = table.raCapPercent * baseForCap;
  return Math.min(c, capByPercent, table.raCapAbsolute);
}

export interface TaxResult {
  taxYearLabel: TaxYearKey;

  annualIncome: number;
  travelAllowanceAnnual: number;
  travelTaxablePortion: number;
  incomeForRA: number;
  retirementAllowed: number;
  taxableIncome: number;

  bracketTax: number;
  rebates: { primary: number; secondary: number; tertiary: number; total: number };
  taxAfterRebates: number;

  mtcAnnual: number;
  amtcAnnual: number;

  annualTax: number;
  monthlyPAYE: number;

  mtcMonthlyPerFamily: number;
  medSchemeAnnual: number;
  medMonths: number;

  age: number;
  effectiveRateOnTaxable: number;
}

export function calculateTax(input: TaxInput, table: TaxTable): TaxResult {
  const age =
    input.explicitAge ??
    ageFromSouthAfricanID(input.idNumber || "") ??
    30;

  // Travel allowance inclusion for PAYE
  const travelAllowanceAnnual = Math.max(0, input.travelAllowanceAnnual || 0);
  const inclusionRate = input.travelMostlyBusiness ? 0.20 : 0.80;
  const travelTaxablePortion = Math.round(travelAllowanceAnnual * inclusionRate);

  // RA cap base = remuneration + taxable travel portion
  const incomeForRA = Math.max(0, (input.annualIncome || 0) + travelTaxablePortion);

  const retirementAllowed = allowedRetirement(incomeForRA, input.retirementContribAnnual, table);
  const taxableIncome = Math.max(0, incomeForRA - retirementAllowed);

  const taxBeforeRebates = bracketTax(taxableIncome, table);

  // Rebates
  const r = table.rebates;
  const primary = r.primary;
  const secondary = age >= 65 ? r.secondary : 0;
  const tertiary = age >= 75 ? r.tertiary : 0;
  const rebatesTotal = primary + secondary + tertiary;

  const taxAfterRebates = Math.max(0, taxBeforeRebates - rebatesTotal);

  // Medical credits
  const months = clampMonths(input.medMonthsCovered);
  const mtcMonthlyFamily = mtcMonthlyForFamily(input.medDependants, table);
  const mtcAnnual = mtcMonthlyFamily * months;

  const medSchemeAnnual = Math.max(0, (input.medSchemeMonthly || 0) * months);
  const medOutOfPocket = Math.max(0, input.medOutOfPocketAnnual || 0);

  let amtc = 0;
  if (age >= 65 || input.hasDisability) {
    const excess = Math.max(0, medSchemeAnnual - 3 * mtcMonthlyFamily * months);
    amtc = (medOutOfPocket + excess) / 3;
  } else {
    const excess = Math.max(0, medSchemeAnnual - 4 * mtcMonthlyFamily * months);
    const base = medOutOfPocket + excess - 0.075 * taxableIncome;
    amtc = base > 0 ? base * 0.25 : 0;
  }

  const annualTax = Math.max(0, taxAfterRebates - mtcAnnual - amtc);

  return {
    taxYearLabel: table.label,

    annualIncome: input.annualIncome || 0,
    travelAllowanceAnnual,
    travelTaxablePortion,
    incomeForRA,
    retirementAllowed,
    taxableIncome,

    bracketTax: taxBeforeRebates,
    rebates: { primary, secondary, tertiary, total: rebatesTotal },
    taxAfterRebates,

    mtcAnnual,
    amtcAnnual: amtc,

    annualTax,
    monthlyPAYE: Math.round(annualTax / 12),

    mtcMonthlyPerFamily: mtcMonthlyFamily,
    medSchemeAnnual,
    medMonths: months,

    age,
    effectiveRateOnTaxable: taxableIncome > 0 ? annualTax / taxableIncome : 0
  };
}
