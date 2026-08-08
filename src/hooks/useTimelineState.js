import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CURRENT_PI_ID,
  getDefaultFeatureDates,
  getNextFeatureId,
  seedFeatures,
  seedProducts,
  seedProjectProducts,
  seedProjectTeams,
  seedProjects,
  seedTeams,
  weekCalendar,
} from '../data'
import { normalizeHex } from '../utils/colors'
import { buildTimelineRows, allSectionIdsInRows } from '../utils/featureGroups'
import { nextMarkerId, nextProductId, nextProjectId, nextTeamId, resetIdCounters, resetMarkerCounter } from '../utils/ids'
import {
  applyProjectFeatureOrder,
  findSectionForVisualIndex,
  reorderFeatureIdsAfterDrop,
  resolveDropTeamTarget,
} from '../utils/timelineLayout'
import {
  computeFeatureAssignmentStatus,
  isOnGantt,
  migrateState,
  orphanedProductIds,
  productIdsForProject,
  refreshFeatureAssignmentStatuses,
} from '../utils/migration'
import { defaultFormattingRulesForProject } from '../utils/formattingRules'
import { hasDependencyCycle, normalizeDependsOn } from '../utils/dependencies'
import { loadActor, loadLayout, loadState, saveActor, saveLayout, saveState } from '../utils/storage'
import { featureWeekSpan, isCrossPi } from '../utils/weekCalendar'

let eventIdCounter = 1
let commentIdCounter = 1

function createEvent(type, actor, featureId, payload, reason = null) {
  return {
    id: eventIdCounter++,
    eventType: type,
    featureId,
    actor,
    reason,
    payload,
    createdAt: new Date().toISOString(),
  }
}

function applyFeatureEditPreview(feature, preview, projectTeams) {
  if (!preview || preview.featureId !== feature.id) return feature
  const isBacklog = !preview.teamId
  const teamId = isBacklog ? null : preview.teamId
  return {
    ...feature,
    teamId,
    planningStatus: isBacklog ? 'backlog' : 'planned',
    assignmentStatus: isBacklog
      ? 'ok'
      : computeFeatureAssignmentStatus({ projectId: feature.projectId, teamId }, projectTeams),
    startDate: preview.startDate,
    targetDate: preview.targetDate,
  }
}

function enrichFeature(feature, products, teams) {
  const product = products.find((p) => p.id === feature.productId)
  const team = teams.find((t) => t.id === feature.teamId)
  const storyPoints = (feature.userStories || []).reduce((s, us) => s + (us.storyPoints || 0), 0)
  const color = product?.color ?? '#6B7280'
  const onGantt = isOnGantt(feature)
  const hasComments = (feature.comments || []).length > 0
  const hasNotes = Boolean(feature.notes?.trim())
  const missingDates = !feature.startDate || !feature.targetDate
  const dependsOn = Array.isArray(feature.dependsOn) ? feature.dependsOn : []

  let startWeek = 0
  let duration = 1
  let crossPi = false

  if (feature.startDate && feature.targetDate) {
    const span = featureWeekSpan(weekCalendar, feature.startDate, feature.targetDate)
    startWeek = span.startWeek
    duration = span.duration
    crossPi = isCrossPi(weekCalendar, feature.startDate, feature.targetDate)
  }

  return {
    ...feature,
    dependsOn,
    storyPoints,
    crossPi,
    startWeek,
    duration,
    onGantt,
    hasComments,
    hasNotes,
    missingDates,
    color,
    productName: product?.name ?? '',
    productColor: color,
    teamName: team?.name ?? '',
  }
}

function sortFeatures(features) {
  return [...features].sort((a, b) => a.sortOrder - b.sortOrder)
}

function countFeaturesForEntity(features, predicate) {
  return features.filter(predicate).length
}

export function useTimelineState() {
  const initial = useMemo(() => migrateState(loadState()), [])

  const [actor, setActorState] = useState(loadActor)
  const [projects, setProjects] = useState(initial.projects)
  const [teams, setTeams] = useState(initial.teams)
  const [projectTeams, setProjectTeams] = useState(initial.projectTeams)
  const [products, setProducts] = useState(initial.products)
  const [projectProducts, setProjectProducts] = useState(initial.projectProducts)
  const [featuresRaw, setFeaturesRaw] = useState(initial.features)
  const [timelineMarkers, setTimelineMarkers] = useState(initial.timelineMarkers ?? [])
  const [formattingRules, setFormattingRules] = useState(initial.formattingRules ?? [])
  const [auditEvents, setAuditEvents] = useState(() => {
    if (initial.auditEvents?.length) {
      eventIdCounter = Math.max(...initial.auditEvents.map((e) => e.id)) + 1
    }
    const allComments = (initial.features ?? []).flatMap((f) => f.comments ?? [])
    if (allComments.length) {
      const nums = allComments.map((c) => parseInt(String(c.id).replace(/\D/g, ''), 10)).filter((n) => !Number.isNaN(n))
      if (nums.length) commentIdCounter = Math.max(...nums) + 1
    }
    return initial.auditEvents ?? []
  })
  const [projectId, setProjectId] = useState(initial.projectId)
  const [viewMode, setViewMode] = useState(initial.viewMode ?? 'all')
  const [filterTeamId, setFilterTeamId] = useState(initial.filterTeamId)
  const [collapsedSections, setCollapsedSections] = useState(initial.collapsedSections ?? {})
  const [selectedFeatureId, setSelectedFeatureId] = useState(null)
  const [featureEditPreview, setFeatureEditPreviewState] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGanttSettings, setShowGanttSettings] = useState(false)
  const [scrollToDate, setScrollToDate] = useState(null)
  const [layout, setLayoutState] = useState(loadLayout)

  useEffect(() => {
    resetIdCounters({ projects, teams, products })
    resetMarkerCounter(timelineMarkers)
  }, [projects, teams, products, timelineMarkers])

  useEffect(() => {
    setFeatureEditPreviewState(null)
  }, [selectedFeatureId])

  const setFeatureEditPreview = useCallback((preview) => {
    setFeatureEditPreviewState((prev) => {
      if (!preview) return prev ? null : prev
      if (
        prev &&
        prev.featureId === preview.featureId &&
        prev.teamId === preview.teamId &&
        prev.startDate === preview.startDate &&
        prev.targetDate === preview.targetDate
      ) {
        return prev
      }
      return preview
    })
  }, [])

  const enrichedFeatures = useMemo(
    () => sortFeatures(featuresRaw.map((f) => enrichFeature(f, products, teams))),
    [featuresRaw, products, teams],
  )

  const timelineEnrichedFeatures = useMemo(
    () =>
      sortFeatures(
        featuresRaw.map((f) =>
          enrichFeature(applyFeatureEditPreview(f, featureEditPreview, projectTeams), products, teams),
        ),
      ),
    [featuresRaw, products, teams, featureEditPreview, projectTeams],
  )

  const projectTeamsForActive = useMemo(
    () => projectTeams.filter((pt) => pt.projectId === projectId),
    [projectTeams, projectId],
  )

  const teamsForProject = useMemo(() => {
    const ids = new Set(projectTeamsForActive.map((pt) => pt.teamId))
    return teams.filter((t) => ids.has(t.id))
  }, [teams, projectTeamsForActive])

  const productsForProject = useMemo(() => {
    const ids = productIdsForProject(projectProducts, projectId)
    return products.filter((p) => ids.has(p.id))
  }, [products, projectProducts, projectId])

  const orphanedProducts = useMemo(() => {
    const ids = new Set(orphanedProductIds(products, projectProducts))
    return products.filter((p) => ids.has(p.id))
  }, [products, projectProducts])

  const collapsedForProject = useMemo(
    () => collapsedSections[projectId] ?? [],
    [collapsedSections, projectId],
  )

  const timelineRows = useMemo(
    () =>
      buildTimelineRows(timelineEnrichedFeatures, {
        viewMode,
        filterTeamId,
        teams,
        projectTeams,
        projectId,
        collapsedSections: collapsedForProject,
      }),
    [timelineEnrichedFeatures, viewMode, filterTeamId, teams, projectTeams, projectId, collapsedForProject],
  )

  const displayFeatures = useMemo(
    () => timelineRows.filter((r) => r.type === 'feature').map((r) => r.feature),
    [timelineRows],
  )

  const selectedFeature = useMemo(
    () => enrichedFeatures.find((f) => f.id === selectedFeatureId) ?? null,
    [enrichedFeatures, selectedFeatureId],
  )

  const ganttFeatures = useMemo(
    () => enrichedFeatures.filter((f) => f.projectId === projectId && f.onGantt),
    [enrichedFeatures, projectId],
  )

  const markersForProject = useMemo(
    () => timelineMarkers.filter((m) => m.projectId === projectId),
    [timelineMarkers, projectId],
  )

  const formattingRulesForProject = useMemo(
    () => formattingRules.filter((r) => r.projectId === projectId),
    [formattingRules, projectId],
  )

  const activeProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  )

  useEffect(() => {
    saveState({
      projects,
      teams,
      projectTeams,
      products,
      projectProducts,
      features: featuresRaw,
      timelineMarkers,
      formattingRules,
      auditEvents,
      projectId,
      viewMode,
      filterTeamId,
      collapsedSections,
    })
  }, [projects, teams, projectTeams, products, projectProducts, featuresRaw, timelineMarkers, formattingRules, auditEvents, projectId, viewMode, filterTeamId, collapsedSections])

  useEffect(() => {
    saveLayout(layout)
  }, [layout])

  const setActor = useCallback((name) => {
    setActorState(name)
    saveActor(name)
  }, [])

  const setLayout = useCallback((updates) => {
    setLayoutState((prev) => ({ ...prev, ...updates }))
  }, [])

  const addAuditEvent = useCallback((event) => {
    setAuditEvents((prev) => [...prev, event])
  }, [])

  const addFeature = useCallback(
    (data) => {
      const id = data.id || getNextFeatureId(featuresRaw)
      const now = new Date().toISOString()
      const isBacklog = !data.teamId
      const teamId = isBacklog ? null : data.teamId
      const feature = {
        id,
        projectId,
        teamId,
        productId: data.productId,
        name: data.name,
        planningStatus: isBacklog ? 'backlog' : 'planned',
        startDate: data.startDate || null,
        targetDate: data.targetDate || null,
        completed: false,
        assignmentStatus: isBacklog
          ? 'ok'
          : computeFeatureAssignmentStatus({ projectId, teamId }, projectTeams),
        userStories: [],
        notes: '',
        comments: [],
        dependsOn: [],
        sortOrder: featuresRaw.length,
        createdAt: now,
        updatedAt: now,
      }
      setFeaturesRaw((prev) => [...prev, feature])
      addAuditEvent(
        createEvent('feature.created', actor, id, {
          name: feature.name,
          projectId,
          teamId: feature.teamId,
          productId: feature.productId,
          planningStatus: feature.planningStatus,
          startDate: feature.startDate,
          targetDate: feature.targetDate,
        }),
      )
      return feature
    },
    [actor, featuresRaw, projectId, projectTeams, addAuditEvent],
  )

  const updateFeature = useCallback(
    (id, updates) => {
      const pendingEvents = []

      setFeaturesRaw((prev) => {
        const idx = prev.findIndex((f) => f.id === id)
        if (idx === -1) return prev
        const current = prev[idx]
        let next = {
          ...current,
          ...updates,
          updatedAt: new Date().toISOString(),
        }

        if (updates.teamId !== undefined) {
          if (!updates.teamId) {
            next.teamId = null
            next.planningStatus = 'backlog'
            next.assignmentStatus = 'ok'
          } else if (!current.teamId && updates.teamId) {
            next.planningStatus = 'planned'
            next.assignmentStatus = computeFeatureAssignmentStatus(
              { projectId: current.projectId, teamId: updates.teamId },
              projectTeams,
            )
            pendingEvents.push(
              createEvent('feature.team_assigned', actor, id, {
                teamId: updates.teamId,
                previousStatus: current.planningStatus,
              }),
            )
          } else if (updates.teamId !== current.teamId) {
            next.planningStatus = 'planned'
            next.assignmentStatus = computeFeatureAssignmentStatus(next, projectTeams)
            pendingEvents.push(
              createEvent('feature.team_changed', actor, id, {
                previous: current.teamId,
                current: updates.teamId,
              }),
            )
          }
        }

        if (updates.dependsOn !== undefined) {
          const deps = normalizeDependsOn(updates.dependsOn)
          if (hasDependencyCycle(id, deps, prev)) {
            return prev
          }
          next.dependsOn = deps
          const currentDeps = normalizeDependsOn(current.dependsOn)
          const added = deps.filter((d) => !currentDeps.includes(d))
          const removed = currentDeps.filter((d) => !deps.includes(d))
          added.forEach((depId) => {
            pendingEvents.push(
              createEvent('feature.dependency_added', actor, id, { dependsOnId: depId }),
            )
          })
          removed.forEach((depId) => {
            pendingEvents.push(
              createEvent('feature.dependency_removed', actor, id, { dependsOnId: depId }),
            )
          })
        }

        if (updates.name && updates.name !== current.name) {
          pendingEvents.push(
            createEvent('feature.renamed', actor, id, {
              previous: current.name,
              current: updates.name,
            }),
          )
        }

        if (updates.startDate !== undefined || updates.targetDate !== undefined) {
          pendingEvents.push(
            createEvent('feature.dates_changed', actor, id, {
              previous: { startDate: current.startDate, targetDate: current.targetDate },
              current: { startDate: next.startDate, targetDate: next.targetDate },
            }),
          )
        }

        if (updates.completed !== undefined && updates.completed !== current.completed) {
          pendingEvents.push(
            createEvent('feature.completed', actor, id, { completed: updates.completed }),
          )
        }

        const copy = [...prev]
        copy[idx] = next
        return copy
      })

      pendingEvents.forEach(addAuditEvent)
    },
    [actor, projectTeams, addAuditEvent],
  )

  const moveFeature = useCallback(
    (id, startDate, targetDate, visualRowIndex) => {
      setFeaturesRaw((prev) => {
        const fromIndex = prev.findIndex((f) => f.id === id)
        if (fromIndex === -1) return prev

        const current = prev[fromIndex]
        const onGantt = isOnGantt(current)
        const moved = onGantt && (current.startDate !== startDate || current.targetDate !== targetDate)

        if (moved) {
          addAuditEvent(
            createEvent('feature.moved', actor, id, {
              previous: { startDate: current.startDate, targetDate: current.targetDate },
              current: { startDate, targetDate },
            }),
          )
        }

        let nextTeamId = current.teamId
        let nextAssignmentStatus = current.assignmentStatus
        let nextPlanningStatus = current.planningStatus

        if (visualRowIndex != null) {
          const section = findSectionForVisualIndex(timelineRows, visualRowIndex)
          const target = resolveDropTeamTarget(section, { viewMode, filterTeamId })

          if (target.toBacklog) {
            if (current.planningStatus !== 'backlog') {
              addAuditEvent(
                createEvent('feature.team_changed', actor, id, {
                  previous: current.teamId,
                  current: null,
                }),
              )
            }
            nextTeamId = null
            nextPlanningStatus = 'backlog'
            nextAssignmentStatus = 'ok'
          } else if (target.unassign) {
            if (current.teamId !== null || current.assignmentStatus !== 'team_unassigned') {
              addAuditEvent(
                createEvent('feature.team_changed', actor, id, {
                  previous: current.teamId,
                  current: null,
                }),
              )
            }
            nextTeamId = null
            nextPlanningStatus = 'planned'
            nextAssignmentStatus = 'team_unassigned'
          } else if (target.teamId && target.teamId !== current.teamId) {
            if (!current.teamId) {
              addAuditEvent(
                createEvent('feature.team_assigned', actor, id, {
                  teamId: target.teamId,
                  previousStatus: current.planningStatus,
                }),
              )
            } else {
              addAuditEvent(
                createEvent('feature.team_changed', actor, id, {
                  previous: current.teamId,
                  current: target.teamId,
                }),
              )
            }
            nextTeamId = target.teamId
            nextPlanningStatus = 'planned'
            nextAssignmentStatus = computeFeatureAssignmentStatus(
              { projectId: current.projectId, teamId: target.teamId },
              projectTeams,
            )
          }

          const orderedIds = reorderFeatureIdsAfterDrop(timelineRows, id, visualRowIndex)
          const updated = {
            ...current,
            startDate: onGantt ? startDate : current.startDate,
            targetDate: onGantt ? targetDate : current.targetDate,
            teamId: nextTeamId,
            planningStatus: nextPlanningStatus,
            assignmentStatus: nextAssignmentStatus,
            updatedAt: new Date().toISOString(),
          }

          const withUpdated = prev.map((f) => (f.id === id ? updated : f))
          return applyProjectFeatureOrder(withUpdated, current.projectId, orderedIds)
        }

        if (!onGantt) return prev

        const updated = {
          ...current,
          startDate,
          targetDate,
          updatedAt: new Date().toISOString(),
        }

        const next = [...prev]
        next[fromIndex] = updated
        return next
      })
    },
    [actor, addAuditEvent, timelineRows, viewMode, filterTeamId, projectTeams],
  )

  const deleteFeature = useCallback((id) => {
    setFeaturesRaw((prev) => prev.filter((f) => f.id !== id))
    setSelectedFeatureId((cur) => (cur === id ? null : cur))
  }, [])

  const addUserStory = useCallback((featureId, title, storyPoints) => {
    setFeaturesRaw((prev) =>
      prev.map((f) => {
        if (f.id !== featureId) return f
        const usId = (f.userStories?.length ?? 0) + 1
        const userStories = [...(f.userStories || []), { id: usId, title, storyPoints }]
        return { ...f, userStories, updatedAt: new Date().toISOString() }
      }),
    )
  }, [])

  const removeUserStory = useCallback((featureId, usId) => {
    setFeaturesRaw((prev) =>
      prev.map((f) => {
        if (f.id !== featureId) return f
        return {
          ...f,
          userStories: (f.userStories || []).filter((us) => us.id !== usId),
          updatedAt: new Date().toISOString(),
        }
      }),
    )
  }, [])

  const addComment = useCallback(
    (featureId, text) => {
      const trimmed = text.trim().slice(0, 500)
      if (!trimmed) return
      const commentId = `c-${commentIdCounter++}`
      const now = new Date().toISOString()
      setFeaturesRaw((prev) =>
        prev.map((f) => {
          if (f.id !== featureId) return f
          return {
            ...f,
            comments: [...(f.comments || []), { id: commentId, author: actor, text: trimmed, createdAt: now }],
            updatedAt: now,
          }
        }),
      )
      addAuditEvent(createEvent('feature.comment_added', actor, featureId, { commentId }))
    },
    [actor, addAuditEvent],
  )

  const updateComment = useCallback(
    (featureId, commentId, text) => {
      const trimmed = text.trim().slice(0, 500)
      if (!trimmed) return
      setFeaturesRaw((prev) =>
        prev.map((f) => {
          if (f.id !== featureId) return f
          return {
            ...f,
            comments: (f.comments || []).map((c) =>
              c.id === commentId && c.author === actor
                ? { ...c, text: trimmed, updatedAt: new Date().toISOString() }
                : c,
            ),
            updatedAt: new Date().toISOString(),
          }
        }),
      )
      addAuditEvent(createEvent('feature.comment_edited', actor, featureId, { commentId }))
    },
    [actor, addAuditEvent],
  )

  const deleteComment = useCallback(
    (featureId, commentId) => {
      setFeaturesRaw((prev) =>
        prev.map((f) => {
          if (f.id !== featureId) return f
          return {
            ...f,
            comments: (f.comments || []).filter((c) => !(c.id === commentId && c.author === actor)),
            updatedAt: new Date().toISOString(),
          }
        }),
      )
      addAuditEvent(createEvent('feature.comment_deleted', actor, featureId, { commentId }))
    },
    [actor, addAuditEvent],
  )

  const saveProjectMarkers = useCallback(
    (markers) => {
      const now = new Date().toISOString()
      const normalized = markers.map((m) => ({
        id: m.id || nextMarkerId(),
        projectId,
        label: m.label.trim(),
        date: m.date,
        color: normalizeHex(m.color || '#8B5CF6'),
        createdAt: m.createdAt || now,
        updatedAt: now,
      }))

      setTimelineMarkers((prev) => {
        const others = prev.filter((m) => m.projectId !== projectId)
        return [...others, ...normalized]
      })

      addAuditEvent(
        createEvent('timeline.markers_updated', actor, null, {
          projectId,
          count: normalized.length,
        }),
      )
    },
    [actor, projectId, addAuditEvent],
  )

  const saveFormattingRules = useCallback(
    (rules) => {
      setFormattingRules((prev) => {
        const others = prev.filter((r) => r.projectId !== projectId)
        return [...others, ...rules.map((r) => ({ ...r, projectId }))]
      })
      addAuditEvent(
        createEvent('formatting_rules.updated', actor, null, {
          projectId,
          count: rules.length,
        }),
      )
    },
    [actor, projectId, addAuditEvent],
  )

  const setViewFilter = useCallback((mode, teamId = null) => {
    setViewMode(mode)
    setFilterTeamId(mode === 'team' ? teamId : null)
  }, [])

  const toggleSectionCollapsed = useCallback((sectionId) => {
    setCollapsedSections((prev) => {
      const current = prev[projectId] ?? []
      const next = current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId]
      return { ...prev, [projectId]: next }
    })
  }, [projectId])

  const collapseAllSections = useCallback(() => {
    const sectionIds = allSectionIdsInRows(timelineRows)
    setCollapsedSections((prev) => ({ ...prev, [projectId]: sectionIds }))
  }, [projectId, timelineRows])

  const expandAllSections = useCallback(() => {
    setCollapsedSections((prev) => ({ ...prev, [projectId]: [] }))
  }, [projectId])

  const requestScrollToDate = useCallback((isoDate) => {
    setScrollToDate(isoDate)
  }, [])

  const clearScrollToDate = useCallback(() => {
    setScrollToDate(null)
  }, [])

  const getFeatureHistory = useCallback(
    (featureId) =>
      auditEvents
        .filter((e) => e.featureId === featureId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20),
    [auditEvents],
  )

  // --- Project CRUD ---

  const createProject = useCallback(
    (name, teamIds = []) => {
      const id = nextProjectId()
      const now = new Date().toISOString()
      const project = { id, name: name.trim(), createdAt: now }
      setProjects((prev) => [...prev, project])
      setFormattingRules((prev) => [...prev, ...defaultFormattingRulesForProject(id)])
      if (teamIds.length) {
        setProjectTeams((prev) => [
          ...prev,
          ...teamIds.map((teamId) => ({ projectId: id, teamId })),
        ])
      }
      addAuditEvent(createEvent('project.created', actor, null, { id, name: project.name, teamIds }))
      setProjectId(id)
      return project
    },
    [actor, addAuditEvent],
  )

  const setProjectTeamIds = useCallback(
    (targetProjectId, teamIds) => {
      setProjectTeams((prev) => {
        const filtered = prev.filter((pt) => pt.projectId !== targetProjectId)
        const next = [
          ...filtered,
          ...teamIds.map((teamId) => ({ projectId: targetProjectId, teamId })),
        ]
        setFeaturesRaw((features) => refreshFeatureAssignmentStatuses(features, next))
        return next
      })
      addAuditEvent(
        createEvent('project.teams_updated', actor, null, { projectId: targetProjectId, teamIds }),
      )
    },
    [actor, addAuditEvent],
  )

  const renameProject = useCallback(
    (id, name) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)),
      )
      addAuditEvent(createEvent('project.renamed', actor, null, { id, name: name.trim() }))
    },
    [actor, addAuditEvent],
  )

  const deleteProject = useCallback(
    (id) => {
      const featureCount = countFeaturesForEntity(featuresRaw, (f) => f.projectId === id)
      if (featureCount > 0) return { ok: false, reason: 'Project has features' }

      setProjectProducts((prev) => prev.filter((pp) => pp.projectId !== id))
      setProjectTeams((prev) => prev.filter((pt) => pt.projectId !== id))
      setProjects((prev) => {
        const next = prev.filter((p) => p.id !== id)
        if (projectId === id) {
          setProjectId(next[0]?.id ?? '')
        }
        return next
      })
      addAuditEvent(createEvent('project.deleted', actor, null, { id }))
      return { ok: true }
    },
    [actor, featuresRaw, projectId, addAuditEvent],
  )

  // --- Team CRUD ---

  const createTeam = useCallback(
    (name) => {
      const id = nextTeamId()
      const team = { id, name: name.trim(), createdAt: new Date().toISOString() }
      setTeams((prev) => [...prev, team])
      addAuditEvent(createEvent('team.created', actor, null, { id, name: team.name }))
      return team
    },
    [actor, addAuditEvent],
  )

  const renameTeam = useCallback(
    (id, name) => {
      setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, name: name.trim() } : t)))
      addAuditEvent(createEvent('team.renamed', actor, null, { id, name: name.trim() }))
    },
    [actor, addAuditEvent],
  )

  const deleteTeam = useCallback(
    (id) => {
      const featureCount = countFeaturesForEntity(featuresRaw, (f) => f.teamId === id)
      if (featureCount > 0) return { ok: false, reason: 'Team has features' }

      setProjectTeams((prev) => prev.filter((pt) => pt.teamId !== id))
      setTeams((prev) => prev.filter((t) => t.id !== id))
      addAuditEvent(createEvent('team.deleted', actor, null, { id }))
      if (filterTeamId === id) setViewFilter('all')
      return { ok: true }
    },
    [actor, featuresRaw, filterTeamId, addAuditEvent, setViewFilter],
  )

  const assignTeamToProject = useCallback(
    (teamId, targetProjectId = projectId) => {
      setProjectTeams((prev) => {
        if (prev.some((pt) => pt.projectId === targetProjectId && pt.teamId === teamId)) {
          return prev
        }
        const next = [...prev, { projectId: targetProjectId, teamId }]
        setFeaturesRaw((features) => refreshFeatureAssignmentStatuses(features, next))
        return next
      })
      addAuditEvent(
        createEvent('team.assigned', actor, null, { projectId: targetProjectId, teamId }),
      )
    },
    [actor, projectId, addAuditEvent],
  )

  const unassignTeamFromProject = useCallback(
    (teamId, targetProjectId = projectId) => {
      const nextProjectTeams = projectTeams.filter(
        (pt) => !(pt.projectId === targetProjectId && pt.teamId === teamId),
      )
      setProjectTeams(nextProjectTeams)
      setFeaturesRaw((prev) =>
        refreshFeatureAssignmentStatuses(prev, nextProjectTeams),
      )
      addAuditEvent(
        createEvent('team.unassigned', actor, null, { projectId: targetProjectId, teamId }),
      )
    },
    [actor, projectId, projectTeams, addAuditEvent],
  )

  // --- Product CRUD ---

  const createProduct = useCallback(
    (name, color, projectIds = [projectId]) => {
      const id = nextProductId()
      const product = {
        id,
        name: name.trim(),
        color: normalizeHex(color),
        createdAt: new Date().toISOString(),
      }
      setProducts((prev) => [...prev, product])
      const uniqueProjectIds = [...new Set(projectIds.filter(Boolean))]
      if (uniqueProjectIds.length) {
        setProjectProducts((prev) => [
          ...prev,
          ...uniqueProjectIds.map((pid) => ({ projectId: pid, productId: id })),
        ])
      }
      addAuditEvent(
        createEvent('product.created', actor, null, {
          id,
          name: product.name,
          color: product.color,
          projectIds: uniqueProjectIds,
        }),
      )
      return product
    },
    [actor, projectId, addAuditEvent],
  )

  const setProductProjectIds = useCallback(
    (productId, projectIds) => {
      setProjectProducts((prev) => {
        const filtered = prev.filter((pp) => pp.productId !== productId)
        return [
          ...filtered,
          ...projectIds.map((pid) => ({ projectId: pid, productId })),
        ]
      })
      addAuditEvent(
        createEvent('product.projects_updated', actor, null, { productId, projectIds }),
      )
    },
    [actor, addAuditEvent],
  )

  const assignProductToProject = useCallback(
    (productId, targetProjectId = projectId) => {
      setProjectProducts((prev) => {
        if (prev.some((pp) => pp.projectId === targetProjectId && pp.productId === productId)) {
          return prev
        }
        return [...prev, { projectId: targetProjectId, productId }]
      })
      addAuditEvent(
        createEvent('product.assigned', actor, null, { projectId: targetProjectId, productId }),
      )
    },
    [actor, projectId, addAuditEvent],
  )

  const unassignProductFromProject = useCallback(
    (productId, targetProjectId = projectId) => {
      setProjectProducts((prev) =>
        prev.filter((pp) => !(pp.projectId === targetProjectId && pp.productId === productId)),
      )
      addAuditEvent(
        createEvent('product.unassigned', actor, null, { projectId: targetProjectId, productId }),
      )
    },
    [actor, projectId, addAuditEvent],
  )
  const updateProduct = useCallback(
    (id, updates) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p
          const next = { ...p, ...updates }
          if (updates.name && updates.name !== p.name) {
            addAuditEvent(createEvent('product.renamed', actor, null, { id, name: updates.name }))
          }
          if (updates.color && updates.color !== p.color) {
            addAuditEvent(
              createEvent('product.color_changed', actor, null, {
                id,
                previous: p.color,
                current: normalizeHex(updates.color),
              }),
            )
            next.color = normalizeHex(updates.color)
          }
          return next
        }),
      )
    },
    [actor, addAuditEvent],
  )

  const deleteProduct = useCallback(
    (id) => {
      const featureCount = countFeaturesForEntity(featuresRaw, (f) => f.productId === id)
      if (featureCount > 0) return { ok: false, reason: 'Product has features' }

      setProducts((prev) => prev.filter((p) => p.id !== id))
      setProjectProducts((prev) => prev.filter((pp) => pp.productId !== id))
      addAuditEvent(createEvent('product.deleted', actor, null, { id }))
      return { ok: true }
    },
    [actor, featuresRaw, addAuditEvent],
  )

  const resetToSeed = useCallback(() => {
    setProjects(seedProjects)
    setTeams(seedTeams)
    setProjectTeams(seedProjectTeams)
    setProducts(seedProducts)
    setProjectProducts(seedProjectProducts)
    setFeaturesRaw(seedFeatures.map((f) => ({ ...f, projectId: f.projectId, assignmentStatus: 'ok', planningStatus: 'planned' })))
    setTimelineMarkers([])
    setFormattingRules(seedProjects.flatMap((p) => defaultFormattingRulesForProject(p.id)))
    setAuditEvents([])
    setProjectId(seedProjects[0].id)
    setViewMode('all')
    setFilterTeamId(null)
    setCollapsedSections({})
    eventIdCounter = 1
  }, [])

  return {
    actor,
    setActor,
    projects,
    teams,
    projectTeams,
    projectProducts,
    products,
    productsForProject,
    teamsForProject,
    orphanedProducts,
    projectId,
    setProjectId,
    activeProject,
    viewMode,
    filterTeamId,
    setViewFilter,
    features: displayFeatures,
    ganttFeatures,
    timelineRows,
    allFeatures: enrichedFeatures,
    selectedFeature,
    selectedFeatureId,
    setSelectedFeatureId,
    setFeatureEditPreview,
    showAddModal,
    setShowAddModal,
    showGanttSettings,
    setShowGanttSettings,
    markersForProject,
    formattingRulesForProject,
    saveProjectMarkers,
    saveFormattingRules,
    scrollToDate,
    requestScrollToDate,
    clearScrollToDate,
    collapsedForProject,
    toggleSectionCollapsed,
    collapseAllSections,
    expandAllSections,
    layout,
    setLayout,
    addFeature,
    updateFeature,
    moveFeature,
    deleteFeature,
    addUserStory,
    removeUserStory,
    addComment,
    updateComment,
    deleteComment,
    getFeatureHistory,
    createProject,
    renameProject,
    deleteProject,
    setProjectTeamIds,
    createTeam,
    renameTeam,
    deleteTeam,
    assignTeamToProject,
    unassignTeamFromProject,
    createProduct,
    updateProduct,
    deleteProduct,
    setProductProjectIds,
    assignProductToProject,
    unassignProductFromProject,
    resetToSeed,
    currentPiId: CURRENT_PI_ID,
    getDefaultFeatureDates,
  }
}
