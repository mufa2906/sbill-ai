export function roundMoney(value: number): number {
  return Math.round(value);
}

export function distributeProportion(
  total: bigint,
  subtotal: bigint,
  grandSubtotal: bigint,
): bigint {
  if (grandSubtotal === 0n) return 0n;
  const proportion = Number(subtotal) / Number(grandSubtotal);
  return BigInt(roundMoney(Number(total) * proportion));
}
