export function formatKobo(amount: string | number) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function nairaToKobo(naira: number) {
  return Math.round(naira * 100);
}
