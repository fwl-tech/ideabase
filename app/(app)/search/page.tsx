'use client'
import { useState } from 'react'
import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '/apps/ideabase'

interface SearchResult {
  idea_id: string
  idea_title: string
  area_id: string
  area_name: string
  matches: { type: string; excerpt: string }[]
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(false)
    try {
      const res = await fetch(`${BASE}/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <Link href={`${BASE}/`} className="text-sm text-gray-400 hover:text-gray-900">← Home</Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-lg font-semibold text-gray-900">Search</h1>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ideas, notes, links, conversations…"
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {searched && results.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-10">No results for "{query}".</p>
        )}

        <div className="space-y-6">
          {results.map((r) => (
            <div key={r.idea_id}>
              <Link
                href={`${BASE}/ideas/${r.idea_id}`}
                className="block font-medium text-gray-900 hover:underline mb-1"
              >
                {r.idea_title}
              </Link>
              <p className="text-xs text-gray-400 mb-2">{r.area_name}</p>
              <div className="space-y-1.5">
                {r.matches.map((m, i) => (
                  <div key={i} className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400 mr-2 capitalize">{m.type}</span>
                    <span dangerouslySetInnerHTML={{ __html: m.excerpt }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
