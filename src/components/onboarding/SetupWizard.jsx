import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Download, FolderKanban, Sparkles, Upload, User, Users } from 'lucide-react'
import { APP_NAME, APP_TAGLINE } from '../../brand'
import BrandWordmark from '../BrandWordmark'
import { downloadFeatureImportTemplate } from '../../utils/featureImport'

const STEPS = [
  { id: 'user', title: 'Your name', icon: User },
  { id: 'project', title: 'Project', icon: FolderKanban },
  { id: 'team', title: 'Team', icon: Users },
  { id: 'import', title: 'Import features', icon: Upload },
]

export default function SetupWizard({ open, initialUserName = '', onComplete, onSkip }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [userName, setUserName] = useState(initialUserName)
  const [projectName, setProjectName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setStepIndex(0)
    setUserName(initialUserName)
    setProjectName('')
    setTeamName('')
    setError('')
  }, [open, initialUserName])

  if (!open) return null

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  const finish = (importFeatures) => {
    onComplete({
      userName: userName.trim(),
      projectName: projectName.trim(),
      teamName: teamName.trim(),
      importFeatures,
    })
  }

  const goNext = () => {
    setError('')
    if (step.id === 'user' && !userName.trim()) {
      setError('Enter your name to continue.')
      return
    }
    if (step.id === 'project' && !projectName.trim()) {
      setError('Enter a project name.')
      return
    }
    if (step.id === 'team' && !teamName.trim()) {
      setError('Enter a team name.')
      return
    }
    if (isLast) {
      finish(true)
      return
    }
    setStepIndex((prev) => prev + 1)
  }

  const goBack = () => {
    setError('')
    setStepIndex((prev) => Math.max(0, prev - 1))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c0f18]/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#12182a] shadow-2xl">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="mb-3 flex items-center gap-2 text-violet-300/80">
            <Sparkles size={14} />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em]">
              {APP_NAME} · {APP_TAGLINE}
            </span>
          </div>
          <BrandWordmark className="mb-4 text-2xl" />
          <p className="text-sm text-gray-400">
            Set up your workspace, then import a feature list or open an empty Gantt.
          </p>
          <div className="mt-4 flex gap-2">
            {STEPS.map((item, index) => (
              <div
                key={item.id}
                className={`h-1 flex-1 rounded-full ${
                  index <= stepIndex ? 'bg-violet-500' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="mb-4 flex items-center gap-2 text-violet-200">
            <step.icon size={16} />
            <h2 className="text-sm font-semibold">{step.title}</h2>
            <span className="text-xs text-gray-500">
              Step {stepIndex + 1} of {STEPS.length}
            </span>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}

          {step.id === 'user' && (
            <div>
              <label className="mb-1 block text-xs text-gray-400">Your name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="How should we record your changes?"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-violet-400 focus:outline-none"
                autoFocus
              />
            </div>
          )}

          {step.id === 'project' && (
            <div>
              <label className="mb-1 block text-xs text-gray-400">Project name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Platform Modernization"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-violet-400 focus:outline-none"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                We&apos;ll attach the SAFe calendar starting at PI 26.2 (6 May – 4 Aug 2026).
              </p>
            </div>
          )}

          {step.id === 'team' && (
            <div>
              <label className="mb-1 block text-xs text-gray-400">Team name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Platform Team"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-violet-400 focus:outline-none"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Use this same name in your CSV if those features should be planned on the Gantt.
              </p>
            </div>
          )}

          {step.id === 'import' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                Import a CSV list into <span className="font-medium text-white">{projectName || 'this project'}</span>.
                You will map columns and preview rows before anything is saved.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-gray-500">
                <li>Feature name and product are required. Team and dates are optional.</li>
                <li>New products are created and assigned to this project.</li>
                <li>Rows that use the team “{teamName || 'your team'}” are planned; unknown teams go to backlog.</li>
              </ul>
              <button
                type="button"
                onClick={downloadFeatureImportTemplate}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200 hover:bg-white/5"
              >
                <Download size={14} />
                Download example CSV
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Skip for now
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            )}
            {isLast && (
              <button
                type="button"
                onClick={() => finish(false)}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                Skip and open Gantt
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              {isLast ? (
                <>
                  <Upload size={14} />
                  Import features
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
