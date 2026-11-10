/** Give legacy local receiving records a distinct prefix without changing SAP identifiers. */
export function normalizeReceivingNumber(number: string): string {
  return number.trim().replace(/^GR(?=-?\d)/, 'RCV').replace(/^TMP-/, 'RCV-TMP-');
}
