'use client'

import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <SignIn
        afterSignInUrl="/apps/ideabase"
        afterSignUpUrl="/apps/ideabase"
        redirectUrl="/apps/ideabase"
      />
    </div>
  )
}
