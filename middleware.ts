import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const BASE = '/apps/ideabase'

const isPublicRoute = createRouteMatcher([
  `${BASE}/login(.*)`,
  `${BASE}/api/health(.*)`,
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      const loginUrl = new URL(`${BASE}/login`, req.url)
      return NextResponse.redirect(loginUrl)
    }
    const email = sessionClaims?.email as string | undefined
    if (email && !email.endsWith('@fairwaterlabs.com')) {
      return NextResponse.json({ error: 'Unauthorized: FWL accounts only' }, { status: 403 })
    }
  }
})

export const config = {
  matcher: [`${'/apps/ideabase'}/(.*)`],
}
