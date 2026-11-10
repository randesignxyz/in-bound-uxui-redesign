import type { GRItem } from './type';

// Zero is a verified outcome, never a missing quantity.
export const getPostingQuantity = (item: GRItem): number =>
  item.finalGrQty ?? item.qcAcceptedQty ?? item.receiveQty ?? 0;

export function formatQuantities<T extends { uom?: string }>(items: T[], quantity: (item: T) => number): string {
  const totals = new Map<string, number>();
  items.forEach(item => {
    const rawUnit = item.uom?.trim() || 'unit unspecified';
    // EA and Pcs both count individual pieces; other units need explicit conversions.
    const unit = /^(ea|each|pcs?|pieces?)$/i.test(rawUnit) ? 'EA' : rawUnit;
    totals.set(unit, (totals.get(unit) ?? 0) + quantity(item));
  });
  return Array.from(totals, ([unit, value]) => `${value.toLocaleString()} ${unit}`).join(' · ') || '—';
}

export function getPostedQuantityForItem(items: GRItem[], poNumber: string, itemCode: string, fallbackPoNumber: string): number {
  return items.filter(item => item.code === itemCode && (item.poNumber || fallbackPoNumber) === poNumber)
    .reduce((total, item) => total + (item.sapPostedQty ?? getPostingQuantity(item)), 0);
}
