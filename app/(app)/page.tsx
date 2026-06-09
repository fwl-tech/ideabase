import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getOrCreateDbUser } from '@/lib/auth'
import { auth } from '@clerk/nextjs/server'
import type { Area } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '/apps/ideabase'

export default async function HomePage() {
  const { userId, sessionClaims } = await auth()
  const email = sessionClaims?.email as string
  const dbUser = userId ? await getOrCreateDbUser(userId, email) : null

  let areas: (Area & { ideas: { count: number }[] })[] = []
  if (dbUser) {
    const supabase = createSupabaseServerClient()
    const { data } = await supabase
      .from('areas')
      .select('*, ideas(count)')
      .eq('user_id', dbUser.id)
      .order('created_at', { ascending: false })
    areas = (data as typeof areas) ?? []
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight text-gray-900">ideabase</h1>
        <Link href={`${BASE}/search`} className="text-sm text-gray-500 hover:text-gray-900">
          Search
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Areas of interest</h2>
          <NewAreaButton />
        </div>

        {areas.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-base">No areas yet.</p>
            <p className="text-sm mt-1">Add an area to start collecting ideas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area) => (
              <Link
                key={area.id}
                href={`${BASE}/areas/${area.id}`}
                className="block border border-gray-200 rounded-xl p-5 hover:border-gray-400 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-1">{area.name}</h3>
                {area.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{area.description}</p>
                )}
                <span className="text-xs text-gray-400">
                  {area.ideas?.[0]?.count ?? 0} idea{(area.ideas?.[0]?.count ?? 0) !== 1 ? 's' : ''}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function NewAreaButton() {
  return (
    <button
      onClick={undefined}
      className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
    >
      + New area
    </button>
  )
}
