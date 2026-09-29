import { describe, expect, it, vi } from 'vitest'
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_BREACHED,
  PASSWORD_TOO_SHORT,
  checkNewPassword,
  isBreachedPassword,
  rangeContainsSuffix,
  sha1Hex,
} from './passwords'

// SHA-1 of "password" is 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8, a famous breached password.
const BREACHED = 'password'
const PREFIX = '5BAA6'
const SUFFIX = '1E4C9B93F3F0682250B6CF8331B7EE68FD8'
const STRONG = 'quiet-harbour-lamp-47'

function rangeResponse(body: string, status = 200) {
  return new Response(body, { status })
}

describe('sha1Hex', () => {
  it('returns the uppercase SHA-1', async () => {
    expect(await sha1Hex(BREACHED)).toBe(PREFIX + SUFFIX)
  })
})

describe('rangeContainsSuffix', () => {
  it('finds a suffix with a real count', () => {
    expect(rangeContainsSuffix(`0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n${SUFFIX}:10434004\r\n`, SUFFIX)).toBe(true)
  })

  it('ignores padding rows with a count of 0', () => {
    expect(rangeContainsSuffix(`${SUFFIX}:0\r\n00D4F6E8FA6EECAD2A3AA415EEC418D38EC:2`, SUFFIX)).toBe(false)
  })

  it('does not match a suffix that only starts the same', () => {
    expect(rangeContainsSuffix(`${SUFFIX}AA:5`, SUFFIX)).toBe(false)
  })
})

describe('isBreachedPassword', () => {
  it('sends only the 5 character prefix, never the password or the full hash', async () => {
    const fetchImpl = vi.fn(async () => rangeResponse(`${SUFFIX}:99`)) as unknown as typeof fetch
    expect(await isBreachedPassword(BREACHED, fetchImpl)).toBe(true)
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`/api/password-check?prefix=${PREFIX}`)
    const query = url.split('?')[1]
    expect(query).toBe(`prefix=${PREFIX}`)
    expect(url).not.toContain(SUFFIX)
    expect(init.credentials).toBe('omit')
  })

  it('is false for a password that is not in the list', async () => {
    const fetchImpl = (async () => rangeResponse('00D4F6E8FA6EECAD2A3AA415EEC418D38EC:2')) as unknown as typeof fetch
    expect(await isBreachedPassword(STRONG, fetchImpl)).toBe(false)
  })

  it('fails open when the check is unavailable', async () => {
    expect(await isBreachedPassword(BREACHED, (async () => rangeResponse('unavailable', 503)) as unknown as typeof fetch)).toBe(false)
    expect(
      await isBreachedPassword(BREACHED, (async () => {
        throw new TypeError('network down')
      }) as unknown as typeof fetch)
    ).toBe(false)
  })

  it('gives up after the timeout instead of hanging sign up', async () => {
    vi.useFakeTimers()
    const hang = ((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        // Like real fetch: reject at once if already aborted, else when it aborts.
        const abort = () => reject(new DOMException('aborted', 'AbortError'))
        if (init.signal?.aborted) abort()
        else init.signal?.addEventListener('abort', abort)
      })) as unknown as typeof fetch
    const result = isBreachedPassword(BREACHED, hang)
    await vi.advanceTimersByTimeAsync(4500)
    expect(await result).toBe(false)
    vi.useRealTimers()
  })
})

describe('checkNewPassword', () => {
  const clean = (async () => rangeResponse('00D4F6E8FA6EECAD2A3AA415EEC418D38EC:2')) as unknown as typeof fetch
  // A service that reports whatever password it is asked about as breached.
  const breachedFor = (password: string) =>
    (async () => rangeResponse(`${(await sha1Hex(password)).slice(5)}:99`)) as unknown as typeof fetch

  it('rejects a password shorter than the minimum without calling the service', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch
    const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1)
    expect(await checkNewPassword(short, fetchImpl)).toEqual({ ok: false, message: PASSWORD_TOO_SHORT })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('accepts a password of exactly the minimum length', async () => {
    expect(await checkNewPassword('a'.repeat(MIN_PASSWORD_LENGTH), clean)).toEqual({ ok: true })
  })

  it('counts characters, not UTF-16 units', async () => {
    expect((await checkNewPassword('😀'.repeat(MIN_PASSWORD_LENGTH - 1), clean)).ok).toBe(false)
    expect((await checkNewPassword('😀'.repeat(MIN_PASSWORD_LENGTH), clean)).ok).toBe(true)
  })

  it('rejects a long enough password found in a breach', async () => {
    const password = 'correct horse battery'
    expect(await checkNewPassword(password, breachedFor(password))).toEqual({ ok: false, message: PASSWORD_BREACHED })
  })

  it('accepts a long enough password that is not breached, and one when the service is down', async () => {
    expect(await checkNewPassword(STRONG, clean)).toEqual({ ok: true })
    expect(await checkNewPassword(STRONG, (async () => rangeResponse('x', 503)) as unknown as typeof fetch)).toEqual({ ok: true })
  })
})
