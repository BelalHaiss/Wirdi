import { parsePhoneNumberWithError } from 'libphonenumber-js';

/**
 * Attempts to parse a raw phone value (from Excel, a form, etc.) into E.164 format.
 *
 * Handles the following input variations:
 *   ✅ Already E.164           "+966501234567"  → "+966501234567"
 *   ✅ 00-prefix               "00966501234567" → "+966501234567"
 *   ✅ Bare international      "966501234567"   → "+966501234567"
 *   ✅ Spaces / dashes / dots  "+966 501-234567"→ "+966501234567"
 *   ✅ Excel numeric cell      966501234567     → "+966501234567"
 *   ⚠️  Local-only number      "0501234567"     → returned as-is (will fail validation — country unknown)
 *   ⚠️  Empty / null           null / ""        → ""
 *
 * Returns the E.164 string when parsing succeeds, otherwise the cleaned raw string.
 * The caller should validate the result with `isValidPhoneNumber`.
 */
export function normalizePhoneInput(raw: unknown): string {
  if (raw == null || raw === '') return '';

  if (typeof raw !== 'string' && typeof raw !== 'number') return '';

  // Excel may give numeric cells as JS numbers (e.g. 966501234567)
  let str =
    typeof raw === 'number'
      ? String(Math.round(raw)) // avoid floating-point noise
      : String(raw).trim();

  // Strip common formatting characters (spaces, dashes, dots, parentheses)
  str = str.replace(/[\s\-().]/g, '');

  // Convert 00-prefix to + (e.g. 00966... → +966...)
  if (str.startsWith('00')) {
    str = '+' + str.slice(2);
  }

  // Bare international digits without + (e.g. 966501234567 — 10-15 digits, not starting with 0)
  if (/^\d{10,15}$/.test(str)) {
    str = '+' + str;
  }

  // Attempt a full parse
  try {
    const parsed = parsePhoneNumberWithError(str);
    if (parsed?.isValid()) {
      return parsed.format('E.164');
    }
  } catch {
    // Not parseable — return cleaned string so Zod validation shows a proper error
  }

  return str;
}
