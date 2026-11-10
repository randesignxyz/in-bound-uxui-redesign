import { normalizeReceivingNumber } from './receivingNumber';

describe('receiving numbers', () => {
  it.each([
    ['GR000125', 'RCV000125'],
    ['GR-2026-0001', 'RCV-2026-0001'],
    ['TMP-0927-123', 'RCV-TMP-0927-123'],
    [' RCV000125 ', 'RCV000125'],
    ['IR-001', 'IR-001'],
    ['26000977', '26000977'],
  ])('normalizes %s to %s without changing existing distinct identifiers', (input, expected) => {
    expect(normalizeReceivingNumber(input)).toBe(expected);
    expect(normalizeReceivingNumber(expected)).toBe(expected);
  });
});
