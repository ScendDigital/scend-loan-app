// web/src/core/tax/utils.ts
const ZAR_FMT = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function fmtCurrency(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return ZAR_FMT.format(v);
}
