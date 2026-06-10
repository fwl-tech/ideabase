import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const BASE = '/apps/ideabase'

const isPublicRoute = createRouteMatcher([
  `${BASE}/login`,
  `${BASE}/login/(.*)`,
  `${BASE}/api/health`,
  `${BASE}/api/health/(.*)`,
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      const loginUrl = new URL(`${BASE}/login`, `https://${req.headers.get('x-forwarded-host') || req.headers.get('host') || 'hatchai.fairwaterlabs.com'}`)
      return Response.redirect(loginUrl)
    }
    const email = sessionClaims?.email as string | undefined
    if (email && !email.endsWith('@fairwaterlabs.com')) {
      return Response.json({ error: 'Unauthorized: FWL accounts only' }, { status: 403 })
    }
  }
})

export const config = {
  matcher: [`${'/apps/ideabase'}/(.*)`],
}
