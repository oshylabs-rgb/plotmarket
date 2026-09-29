/**
 * Password rules for new passwords: a minimum length and a check against known
 * data breaches (Have I Been Pwned, Pwned Passwords). Supabase does this
 * server side only on its Pro plan, so it is done here for free.
 *
 * Privacy: the browser hashes the password (SHA-1) and sends only the first 5
 * hex characters of the hash to /api/password-check. That route asks Have I
 * Been Pwned for every breached hash sharing those 5 characters (hundreds of
 * them) and the browser looks for its own full hash in the list. The password
 * and the full hash never leave the device for this check.
 *
 * This is a guard for honest users, not a security boundary: someone calling
 * the Supabase API directly skips it. If the check itself is unavailable it
 * lets the password through rather than blocking sign up.
 */

export const MIN_PASSWORD_LENGTH = 10

export const PASSWORD_HINT = `At least ${MIN_PASSWORD_LENGTH} characters. It is checked against known data breaches, and the checking service never sees the password itself.`

export const PASSWORD_TOO_SHORT = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
export const PASSWORD_BREACHED =
  'That password has appeared in a known data breach, so attackers already try it. Choose a different one.'

export type PasswordCheck = { ok: true } | { ok: false; message: string }

const CHECK_TIMEOUT_MS = 4000

/** Uppercase hex SHA-1 of the text. */
export async function sha1Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

/**
 * Looks for a hash suffix in a Pwned Passwords range response ("SUFFIX:COUNT"
 * per line). Rows with a count of 0 are padding added to hide the real result
 * size, not breaches.
 */
export function rangeContainsSuffix(rangeText: string, suffix: string): boolean {
  for (const line of rangeText.split('\n')) {
    const [candidate, count] = line.trim().split(':')
    if (candidate === suffix && Number(count) > 0) return true
  }
  return false
}

/** True only when the password is known to be in a breach. Any failure is false. */
export async function isBreachedPassword(password: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)
  try {
    const hash = await sha1Hex(password)
    const res = await fetchImpl(`/api/password-check?prefix=${hash.slice(0, 5)}`, {
      signal: controller.signal,
      credentials: 'omit',
    })
    if (!res.ok) return false
    return rangeContainsSuffix(await res.text(), hash.slice(5))
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export async function checkNewPassword(password: string, fetchImpl: typeof fetch = fetch): Promise<PasswordCheck> {
  if (Array.from(password).length < MIN_PASSWORD_LENGTH) return { ok: false, message: PASSWORD_TOO_SHORT }
  if (await isBreachedPassword(password, fetchImpl)) return { ok: false, message: PASSWORD_BREACHED }
  return { ok: true }
}
