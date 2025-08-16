export function fmtCurrency(v: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);
}
export function ageFromSouthAfricanID(id: string) {
  if (!/^\d{13}$/.test(id)) return null;
  const yy = Number(id.slice(0, 2));
  const mm = Number(id.slice(2, 4));
  const dd = Number(id.slice(4, 6));
  const year = yy + (yy <= 25 ? 2000 : 1900);
  const dob = new Date(year, mm - 1, dd);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}
