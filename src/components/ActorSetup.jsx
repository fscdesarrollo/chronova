import { useEffect, useState } from 'react'
import { User } from 'lucide-react'

export default function ActorSetup({ actor, onSave }) {
  const [name, setName] = useState(actor)
  const [open, setOpen] = useState(!actor)

  useEffect(() => {
    setOpen(!actor)
  }, [actor])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Who are you?</h2>
            <p className="text-sm text-gray-500">
              Enter your name to record changes on the timeline.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}
