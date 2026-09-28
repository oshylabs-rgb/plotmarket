/**
 * Transactional email through Resend (verified domain oshylabs.eu). Returns
 * false instead of throwing so a failed send never blocks the job that
 * triggered it; callers only mark a message sent when this returns true.
 */
export async function sendEmail(message: { to: string; subject: string; text: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('sendEmail: RESEND_API_KEY is not set; not sent:', message.subject)
    return false
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Plotmarket <arnold.oshenye@oshylabs.eu>',
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    })
    if (!response.ok) {
      console.error('sendEmail: Resend refused', response.status, await response.text())
      return false
    }
    return true
  } catch (error) {
    console.error('sendEmail: request failed', error)
    return false
  }
}
