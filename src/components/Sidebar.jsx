import {
  LayoutGrid,
  FolderOpen,
  Users,
  CalendarDays,
  BarChart3,
  UserCircle,
  Clock,
} from 'lucide-react'

const navItems = [
  { icon: LayoutGrid, label: 'App' },
  { icon: FolderOpen, label: 'Projects' },
  { icon: Users, label: 'People' },
  { icon: CalendarDays, label: 'PI' },
  { icon: BarChart3, label: 'Timeline', active: true },
  { icon: UserCircle, label: 'Team' },
  { icon: Clock, label: 'History' },
]

export default function Sidebar() {
  return (
    <aside className="flex w-14 shrink-0 flex-col items-center gap-1 bg-sidebar py-4">
      {navItems.map(({ icon: Icon, label, active }) => (
        <button
          key={label}
          title={label}
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
            active
              ? 'bg-violet-600 text-white'
              : 'text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Icon size={20} strokeWidth={1.75} />
        </button>
      ))}
    </aside>
  )
}
