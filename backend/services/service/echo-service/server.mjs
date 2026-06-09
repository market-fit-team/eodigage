// backend/echo-service/server.mjs
// Server-to-server: pass Authorization: Bearer <jwt> to profile-service

import express from "express"

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3002
const PROFILE_BASE_URL = process.env.PROFILE_BASE_URL // e.g. http://profile-service:3001

if (!PROFILE_BASE_URL) {
  console.error("[echo-service] Missing env: PROFILE_BASE_URL")
  process.exit(1)
}

app.get("/health", (_req, res) => res.json({ ok: true }))

app.get("/echo", async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: "NO_AUTH_HEADER" })

  const r = await fetch(`${PROFILE_BASE_URL}/me`, {
    method: "GET",
    headers: {
      // ✅ JWT 그대로 전달
      Authorization: auth,
    },
  })

  const bodyText = await r.text()
  let body
  try { body = JSON.parse(bodyText) } catch { body = { raw: bodyText } }

  return res.status(r.status).json({
    from: "echo-service",
    profile: body,
  })
})

app.listen(PORT, () => {
  console.log(`[echo-service] listening on :${PORT}`)
})
