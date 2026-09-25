import { ImageResponse } from 'next/og'

export const alt = 'Plotmarket. Land and property in Nigeria, with the papers shown.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#12352a',
          color: '#ffffff',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: '#14613a',
              border: '2px solid #f0c435',
              display: 'flex',
            }}
          />
          <div style={{ fontSize: 40, fontWeight: 700, display: 'flex' }}>
            Plot<span style={{ color: '#f0c435' }}>market</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, fontWeight: 700, maxWidth: 1000 }}>
            Land and property in Nigeria, with the papers shown
          </div>
          <div style={{ fontSize: 30, color: '#cfe3d6', fontFamily: 'Helvetica, Arial, sans-serif' }}>
            Title document and seller named on every listing
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 14,
            fontSize: 22,
            color: '#12352a',
            fontFamily: 'Helvetica, Arial, sans-serif',
          }}
        >
          {['C of O', 'Governor’s Consent', 'Deed of Assignment', 'Excision', 'Gazette'].map((t) => (
            <div key={t} style={{ background: '#f0c435', padding: '8px 16px', borderRadius: 999, display: 'flex' }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  )
}
