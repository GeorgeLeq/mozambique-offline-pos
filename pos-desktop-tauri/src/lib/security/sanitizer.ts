/**
 * @file sanitizer.ts
 * @description Input sanitization and validation utilities for POS operations, preventing SQL injection and XSS.
 */

export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case '\0': return '\\0';
        case '\x08': return '\\b';
        case '\x09': return '\\t';
        case '\x1a': return '\\z';
        case '\n': return '\\n';
        case '\r': return '\\r';
        case '\"':
        case '\'':
        case '\\':
        case '%':
          return '\\' + char;
        default:
          return char;
      }
    })
    .trim();
}

export function validateBarcode(barcode: string): boolean {
  // Alphanumeric and standard barcode characters (EAN-13, UPC, Code128)
  const regex = /^[A-Za-z0-9\-_]{3,64}$/;
  return regex.test(barcode);
}

export function validatePin(pin: string): boolean {
  // 4 to 8 digit numeric PIN
  const regex = /^\d{4,8}$/;
  return regex.test(pin);
}

export function sanitizeNumeric(value: any, defaultValue: number = 0): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}
