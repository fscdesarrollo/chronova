import { normalizeHex } from '../utils/colors'

export default function ColorPicker({ value, onChange }) {
  const hex = normalizeHex(value)

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded border border-gray-300 bg-white p-0.5"
        aria-label="Pick color"
      />
      <input
        type="text"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#3B82F6"
        className="w-28 rounded-lg border border-gray-300 px-2 py-1.5 font-mono text-sm uppercase focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
      />
      <span
        className="h-6 w-6 shrink-0 rounded-full border border-gray-200"
        style={{ backgroundColor: hex }}
      />
    </div>
  )
}
