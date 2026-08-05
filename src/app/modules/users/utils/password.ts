/**
 * Password generation for account handover.
 *
 * There is no invite email and no activation step — whoever creates the account
 * has to communicate the password out-of-band (§6.1), so the UI needs to produce
 * one that is strong and safe to read aloud or retype.
 */

/** Ambiguous glyphs (0/O, 1/l/I) are excluded so a dictated password survives. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/** Comfortably above the backend's 8-character minimum; no complexity rule exists. */
const LENGTH = 16;

export function generatePassword(length = LENGTH): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  // Reject values in the final partial block so every character stays equally likely.
  const limit = Math.floor(0xffffffff / ALPHABET.length) * ALPHABET.length;
  let result = '';
  for (let i = 0; i < length; i++) {
    let value = values[i];
    while (value >= limit) {
      const replacement = new Uint32Array(1);
      crypto.getRandomValues(replacement);
      value = replacement[0];
    }
    result += ALPHABET[value % ALPHABET.length];
  }
  return result;
}

/** Resolves `false` when the clipboard is unavailable (insecure origin, denied). */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
