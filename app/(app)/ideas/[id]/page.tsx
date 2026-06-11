import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getOrCreateDbUser } from '@/lib/auth'
import { auth } from '@clerk/nextjs/server'
import { QuickCapture } from '@/components/QuickCapture'
import { BASE } from '@/lib/constants'
import type { Idea, Link as LinkType, Note, Conversation } from '@/types'

const OPINION_FIELDS: { key: keyof Idea; label: string }[] = [
  { key: 'problem', label: 'Problem' },
  { key: 'solution', label: 'Solution' },
  { key: 'commercial_models', label: 'Commercial models' },
  { key: 'competitors', label: 'Competitors' },
  { key: 'demand_signals', label: 'Demand signals' },
]

export default async function IdeaPage({ params }: { params: { id: string } }) {
  const { userId, sessionClaims } = await auth()
  if (!userId) notFound()

  const email = sessionClaims?.email as string
  const dbUser = await getOrCreateDbUser(userId, email)
  if (!dbUser) notFound()

  const supabase = createSupabaseServerClient()
  const { data: idea } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', dbUser.id)
    .single()
  if (!idea) notFound()

  // Scope area fetch to the authenticated user as well
  const { data: area } = await supabase
    .from('areas')
    .select('*')
    .eq('id', idea.area_id)
    .eq('user_id', dbUser.id)
    .single()

  const [{ data: links }, { data: notes }, { data: conversations }] = await Promise.all([
    supabase.from('links').select('*').eq('idea_id', params.id).order('added_at', { ascending: false }),
    supabase.from('notes').select('*').eq('idea_id', params.id).order('created_at', { ascending: false }),
    supabase.from('conversations').select('*').eq('idea_id', params.id).order('created_at', { ascending: false }),
  ])

  // Merge feed and sort by created_at descending
  const feed = [
    ...(links ?? []).map((l: LinkType) => ({ type: 'link' as const, created_at: l.added_at, data: l })),
    ...(notes ?? []).map((n: Note) => ({ type: 'note' as const, created_at: n.created_at, data: n })),
    ...(conversations ?? []).map((c: Conversation) => ({ type: 'conversation' as const, created_at: c.created_at, data: c })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <Link href={`${BASE}/areas/${idea.area_id}`} className="text-sm text-gray-400 hover:text-gray-900">
          ← {area?.name ?? 'Area'}
        </Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 truncate">{idea.title}</h1>
        {idea.status && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{idea.status}</span>
        )}
      </header>

      {/* Quick capture bar */}
      <div className="border-b border-gray-100 px-6 py-3 bg-gray-50">
        <QuickCapture ideaId={params.id} />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
        {/* Opinion fields */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Thesis</h2>
          <div className="space-y-4">
            {OPINION_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {(idea as Record<string, unknown>)[key] as string ?? <span className="text-gray-300 italic">Not filled in yet</span>}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Feed */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Research &amp; notes ({feed.length})
          </h2>
          {feed.length === 0 ? (
            <p className="text-gray-400 text-sm">No links, notes or conversations yet.</p>
          ) : (
            <div className="space-y-3">
              {feed.map((item) => (
                <FeedItem key={`${item.type}-${item.data.id}`} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function FeedItem({ item }: { item: { type: 'link' | 'note' | 'conversation'; created_at: string; data: LinkType | Note | Conversation } }) {
  const date = new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  if (item.type === 'link') {
    const l = item.data as LinkType
    // Only render safe http/https URLs to prevent protocol injection
    const isSafeUrl = l.url.startsWith('https://') || l.url.startsWith('http://')
    return (
      <div className="border border-gray-200 rounded-xl p-4">
        <div className="flex items-start justify-between gap-2">
          {isSafeUrl ? (
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate">
              {l.title ?? l.url}
            </a>
          ) : (
            <span className="text-sm font-medium text-gray-600 truncate">{l.title ?? l.url}</span>
          )}
          <span className="text-xs text-gray-400 flex-shrink-0">{date}</span>
        </div>
        {l.summary && <p className="text-sm text-gray-600 mt-1.5">{l.summary}</p>}
        {l.title && <p className="text-xs text-gray-400 mt-1 truncate">{l.url}</p>}
      </div>
    )
  }

  if (item.type === 'note') {
    const n = item.data as Note
    return (
      <div className="border border-gray-200 rounded-xl p-4">
        <div className="flex justify-between items-start gap-2">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{n.body}</p>
          <span className="text-xs text-gray-400 flex-shrink-0">{date}</span>
        </div>
      </div>
    )
  }

  const c = item.data as Conversation
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex justify-between items-start gap-2 mb-2">
        <div>
          {c.contact_name && (
            <p className="text-xs font-medium text-gray-600">
              {c.contact_name}{c.contact_role ? ` · ${c.contact_role}` : ''}
            </p>
          )}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{c.date ?? date}</span>
      </div>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.summary}</p>
    </div>
  )
}
