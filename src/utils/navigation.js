const NAV_KEY = 'chronova-navigation'

const VALID_PAGES = ['home', 'timeline', 'projects', 'iterations', 'teams', 'products']

const DEFAULT_NAV = {
  hasVisited: false,
  lastPage: 'home',
}

export function loadNavigation() {
  try {
    const raw = localStorage.getItem(NAV_KEY)
    if (!raw) return { ...DEFAULT_NAV }
    const parsed = JSON.parse(raw)
    return {
      hasVisited: Boolean(parsed.hasVisited),
      lastPage: VALID_PAGES.includes(parsed.lastPage) ? parsed.lastPage : 'home',
    }
  } catch {
    return { ...DEFAULT_NAV }
  }
}

export function getInitialPage() {
  const nav = loadNavigation()
  if (!nav.hasVisited) return 'home'
  return nav.lastPage
}

export function saveNavigation(page) {
  if (!VALID_PAGES.includes(page)) return
  try {
    localStorage.setItem(
      NAV_KEY,
      JSON.stringify({
        hasVisited: true,
        lastPage: page,
      }),
    )
  } catch { /* ignore */ }
}
