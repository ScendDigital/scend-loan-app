// web/src/lib/tax/calc.ts
// ...everything above is unchanged...

export function calculateAnnualPAYE(input: {
  // ...existing fields...
  partialYearByDays?: boolean;
  yearDaysWorked?: number;
  yearDaysInYear?: number;

  prorataMonthByDays?: boolean;
  monthWorkedDays?: number;
  monthDaysInPeriod?: number;
}) {
  // ...existing code up to:
  const taxAfterCredits = Math.max(0, taxAfterRebates - mtcAnnual - amtc);

  // ---- Monthly baselines ----
  // Employers generally don't apply AMTC in PAYE. Expose both baselines:
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
    rebates: baseRebates,
    taxAfterRebates,
    mtcMonthly,
    mtcAnnual,
    amtc,
    taxAfterCredits,

    // annual pro-rata (days)
    annualTaxProratedDays,
    annualProrationFactorDays,

    // monthly baselines and pro-rata
    monthlyPAYE_with_AMTC,
    monthlyPAYE_without_AMTC,
    monthlyPAYEProrataDays,        // with AMTC
    monthlyPAYEProrataDaysNoAMTC,  // WITHOUT AMTC  ← use this for PAYE
    monthProrationPctDays,
  };
}
