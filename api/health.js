import { getProvider, send } from './_lib/server.js'
export default function handler(req, res) {
  send(res, 200, { ok: true, provider: getProvider() })
}
