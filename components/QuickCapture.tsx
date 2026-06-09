'use client'
import { useState } from 'react'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '/apps/ideabase'

type CaptureType = 'link' | 'note' | 'conversation'

interface Props {
  ideaId: string
}

export function QuickCapture({ ideaId }: Props) {
  const [type, setType] = useState<CaptureType>('link')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ url: '', note: '', summary: '', contact_name: '', contact_role: '', date: '' })

  function reset() {
    setForm({ url: '', note: '', summary: '', contact_name: '', contact_role: '', date: '' })
    setOpen(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (type === 'link') {
        if (!form.url.trim()) return
        await fetch(`${BASE}/api/links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea_id: ideaId, url: form.url.trim() }),
        })
      } else if (type === 'note') {
        if (!form.note.trim()) return
        await fetch(`${BASE}/api/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea_id: ideaId, body: form.note.trim() }),
        })
      } else {
        if (!form.summary.trim()) return
        await fetch(`${BASE}/api/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idea_id: ideaId,
            summary: form.summary.trim(),
            contact_name: form.contact_name || null,
            contact_role: form.contact_role || null,
            date: form.date || null,
          }),
        })
      }
      reset()
      window.location.reload()
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <div className="flex gap-2">
        <button onClick={() => { setType('link'); setOpen(true) }} className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-gray-400 transition-colors">+ Link</button>
        <button onClick={() => { setType('note'); setOpen(true) }} className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-gray-400 transition-colors">+ Note</button>
        <button onClick={() => { setType('conversation'); setOpen(true) }} className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-gray-400 transition-colors">+ Conversation</button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex gap-2 mb-1">
        {(['link', 'note', 'conversation'] as CaptureType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
              type === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {type === 'link' && (
        <input
          type="url"
          placeholder="Paste a URL"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          autoFocus
        />
      )}

      {type === 'note' && (
        <textarea
          placeholder="Write a note…"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
          autoFocus
        />
      )}

      {type === 'conversation' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contact name"
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
            <input
              type="text"
              placeholder="Role"
              value={form.contact_role}
              onChange={(e) => setForm({ ...form, contact_role: e.target.value })}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <textarea
            placeholder="Summary of the conversation…"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
            autoFocus
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-700 px-3 py-1.5">Cancel</button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
