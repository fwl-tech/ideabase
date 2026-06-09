import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getOrCreateDbUser } from '@/lib/auth'
import { auth } from '@clerk/nextjs/server'
import type { Idea } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '/apps/ideabase'

export default async function AreaPage({ params }: { params: { id: string } }) {
  const { userId, sessionClaims } = await auth()
  if (!userId) notFound()

  const email = sessionClaims?.email as string
  const dbUser = await getOrCreateDbUser(userId, email)
  if (!dbUser) notFound()

  const supabase = createSupabaseServerClient()
  const { data: area } = await supabase
    .from('areas')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', dbUser.id)
    .single()

  if (!area) notFound()

  const { data: ideas } = await supabase
    .from('ideas')
    .select('*')
    .eq('area_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <Link href={`${BASE}/`} className="text-sm text-gray-400 hover:text-gray-900">← Areas</Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-lg font-semibold text-gray-900">{area.name}</h1>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {area.description && (
          <p className="text-gray-500 mb-8">{area.description}</p>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Ideas</h2>
          <Link
            href={`${BASE}/ideas/new?area_id=${area.id}`}
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            + New idea
          </Link>
        </div>

        {(!ideas || ideas.length === 0) ? (
          <p className="text-gray-400 text-sm py-12 text-center">No ideas yet in this area.</p>
        ) : (
          <div className="space-y-3">
            {ideas.map((idea: Idea) => (
              <Link
                key={idea.id}
                href={`${BASE}/ideas/${idea.id}`}
                className="flex items-center justify-between border border-gray-200 rounded-xl px-5 py-4 hover:border-gray-400 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{idea.title}</p>
                  {idea.problem && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{idea.problem}</p>
                  )}
                </div>
                {idea.status && (
                  <span className="ml-4 flex-shrink-0 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    {idea.status}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
