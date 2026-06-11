'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BASE } from '@/lib/constants'

export function NewAreaButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleOpen() {
    setOpen(true)
    setError(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleCancel() {
    setOpen(false)
    setName('')
    setDescription('')
    setError(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${BASE}/api/areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error ?? 'Failed to create area')
        return
      }
      setOpen(false)
      setName('')
      setDescription('')
      router.refresh()
    } catch {
      setError('Failed to create area. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        + New area
      </button>
    )
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-2 items-end">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Area name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 w-48"
          maxLength={200}
          required
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 w-60"
          maxLength={500}
        />
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-gray-400 hover:text-gray-700 px-3 py-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </form>
  )
}
