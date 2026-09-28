// A stand-in for the few Supabase REST calls the public pages make, so the
// end-to-end tests run a real production build against known listings with
// no network access and no real project. Never used outside tests.
//
//   node e2e/mock-supabase.mjs   (listens on MOCK_SUPABASE_PORT, default 54400)

import http from 'node:http'
import { FIXTURES, PROFILES } from './fixtures.mjs'

const PROPERTIES = Object.values(FIXTURES)

// Just enough of PostgREST's filter syntax: col=eq.value
function applyFilters(rows, params) {
  let out = rows
  for (const [key, value] of params) {
    if (['select', 'order', 'limit', 'offset'].includes(key)) continue
    if (value.startsWith('eq.')) {
      const v = decodeURIComponent(value.slice(3))
      out = out.filter((r) => String(r[key]) === v)
    }
  }
  const limit = params.get('limit')
  return limit ? out.slice(0, Number(limit)) : out
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const single = String(req.headers.accept || '').includes('vnd.pgrst.object')

  if (req.method === 'GET' && (url.pathname === '/rest/v1/properties' || url.pathname === '/rest/v1/profiles')) {
    const table = url.pathname.endsWith('properties') ? PROPERTIES : PROFILES
    const rows = applyFilters(table, url.searchParams)
    if (single) {
      return rows.length === 1
        ? send(res, 200, rows[0])
        : send(res, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' })
    }
    return send(res, 200, rows, { 'Content-Range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` })
  }

  if (req.method === 'POST' && url.pathname === '/rest/v1/rpc/listing_availability') {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const { p_id } = JSON.parse(body || '{}')
      const row = PROPERTIES.find((p) => p.id === p_id)
      send(res, 200, row ? (row.status === 'approved' ? 'live' : 'unavailable') : null)
    })
    return
  }

  if (url.pathname.startsWith('/auth/v1/')) {
    return send(res, 401, { message: 'no session' })
  }

  send(res, 404, { message: `mock has no route for ${req.method} ${url.pathname}` })
})

const port = Number(process.env.MOCK_SUPABASE_PORT || 54400)
server.listen(port, '127.0.0.1', () => {
  console.log(`mock supabase listening on ${port}`)
})
