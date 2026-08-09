const ONBOARDING_KEY = 'chronova-onboarding'

const DEFAULT_ONBOARDING = {
  wizardCompleted: false,
  checklistDismissed: false,
  tourCompleted: false,
}

export function loadOnboarding() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY)
    if (!raw) return { ...DEFAULT_ONBOARDING }
    return { ...DEFAULT_ONBOARDING, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_ONBOARDING }
  }
}

export function saveOnboarding(state) {
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

export function markWizardCompleted() {
  const current = loadOnboarding()
  saveOnboarding({ ...current, wizardCompleted: true })
}

export function markTourCompleted() {
  const current = loadOnboarding()
  saveOnboarding({ ...current, tourCompleted: true })
}

export function dismissSetupChecklist() {
  const current = loadOnboarding()
  saveOnboarding({ ...current, checklistDismissed: true })
}

export function resetOnboarding() {
  try {
    localStorage.removeItem(ONBOARDING_KEY)
  } catch { /* ignore */ }
}
