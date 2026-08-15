import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import TopNav from './components/TopNav'
import TimelineGrid from './components/TimelineGrid'
import Footer from './components/Footer'
import AddFeatureModal from './components/AddFeatureModal'
import GanttSettingsModal from './components/GanttSettingsModal'
import FeatureDetailPanel from './components/FeatureDetailPanel'
import ProjectsPage from './components/pages/ProjectsPage'
import TeamsPage from './components/pages/TeamsPage'
import ProductsPage from './components/pages/ProductsPage'
import IterationsPage from './components/pages/IterationsPage'
import HomePage from './components/pages/HomePage'
import SetupWizard from './components/onboarding/SetupWizard'
import GanttSetupChecklist from './components/onboarding/GanttSetupChecklist'
import TourRunner from './components/onboarding/TourRunner'
import { PAGE_TITLES } from './brand'
import { useTimelineState } from './hooks/useTimelineState'
import {
  dismissSetupChecklist,
  loadOnboarding,
  markTourCompleted,
  markWizardCompleted,
} from './utils/onboarding'
import { getInitialPage, loadNavigation, saveNavigation } from './utils/navigation'

function PageShell({ children }) {
  return (
    <div data-tour="page-main" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {children}
    </div>
  )
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(getInitialPage)
  const [onboarding, setOnboarding] = useState(loadOnboarding)
  const [showWizard, setShowWizard] = useState(false)
  const [activeTourId, setActiveTourId] = useState(null)
  const [navMemory, setNavMemory] = useState(loadNavigation)
  const timeline = useTimelineState()
  const detailPanelRef = useRef(null)

  const readiness = timeline.ganttReadiness

  const showChecklist =
    currentPage === 'timeline' &&
    !onboarding.checklistDismissed &&
    !readiness.isComplete

  useEffect(() => {
    if (readiness.isComplete && !onboarding.wizardCompleted) {
      markWizardCompleted()
      setOnboarding(loadOnboarding())
    }
  }, [readiness.isComplete, onboarding.wizardCompleted])

  const navigateToPage = (page) => {
    setCurrentPage(page)
    saveNavigation(page)
    setNavMemory(loadNavigation())
  }

  const navigateTo = (page) => {
    requestProtectedAction(() => navigateToPage(page))
  }

  const handleOpenFromHome = () => {
    const nav = loadNavigation()
    const target = nav.hasVisited && nav.lastPage !== 'home' ? nav.lastPage : 'timeline'
    navigateTo(target)
  }

  const requestProtectedAction = (action) => {
    if (currentPage === 'timeline' && timeline.selectedFeatureId && detailPanelRef.current) {
      detailPanelRef.current.requestLeave(action)
      return
    }
    action()
  }

  const requestSelectFeature = (id) => {
    if (id === timeline.selectedFeatureId) return
    requestProtectedAction(() => timeline.setSelectedFeatureId(id))
  }

  const requestDeselectFeature = () => {
    requestProtectedAction(() => timeline.setSelectedFeatureId(null))
  }

  const handleProjectChange = (projectId) => {
    requestProtectedAction(() => timeline.setProjectId(projectId))
  }

  const defaultDates = useMemo(() => timeline.getDefaultFeatureDates(), [timeline])
  const history = timeline.selectedFeature
    ? timeline.getFeatureHistory(timeline.selectedFeature.id)
    : []

  const leftColWidth = timeline.layout.leftColWidth

  const handleLeftColWidthChange = (width) => {
    timeline.setLayout({ leftColWidth: width })
  }

  const handleWizardComplete = (payload) => {
    timeline.setActor(payload.userName)
    const result = timeline.setupProjectForGantt({
      projectName: payload.projectName,
      teamName: payload.teamName,
      featureName: payload.featureName,
      calendarStartDate: payload.calendarStartDate,
    })
    markWizardCompleted()
    setOnboarding(loadOnboarding())
    setShowWizard(false)
    navigateToPage('timeline')
    if (result.feature?.id) {
      timeline.setSelectedFeatureId(result.feature.id)
      if (result.feature.startDate) {
        timeline.requestScrollToDate(result.feature.startDate)
      }
    }
  }

  const handleWizardSkip = () => {
    setShowWizard(false)
  }

  const handleStartTour = () => {
    setActiveTourId('app-intro')
  }

  const handleTourClose = () => {
    setActiveTourId(null)
  }

  const handleTourComplete = () => {
    markTourCompleted()
    setOnboarding(loadOnboarding())
    setActiveTourId(null)
  }

  const handleAddFeature = () => {
    if (!readiness.canAddFeature) {
      setShowWizard(true)
      return
    }
    requestProtectedAction(() => timeline.setShowAddModal(true))
  }

  const renderMainContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            activeProject={timeline.projects.find((p) => p.id === timeline.projectId)}
            ganttReady={readiness.isReady}
            hasVisited={navMemory.hasVisited}
            lastPage={navMemory.lastPage}
            promoteTour={!onboarding.tourCompleted && !navMemory.hasVisited}
            onOpenTimeline={handleOpenFromHome}
            onStartTour={handleStartTour}
            onStartSetup={() => setShowWizard(true)}
            onConfigureProject={() => navigateTo('projects')}
          />
        )
      case 'projects':
        return (
          <PageShell>
            <ProjectsPage
              projects={timeline.projects}
              teams={timeline.teams}
              projectTeams={timeline.projectTeams}
              iterationPlans={timeline.iterationPlans}
              projectIterationPlans={timeline.projectIterationPlans}
              features={timeline.allFeatures}
              projectId={timeline.projectId}
              onSelectProject={timeline.setProjectId}
              onCreate={timeline.createProject}
              onRename={timeline.renameProject}
              onDelete={timeline.deleteProject}
              onSetProjectTeams={timeline.setProjectTeamIds}
              onSetProjectIterationPlan={timeline.setProjectIterationPlan}
            />
          </PageShell>
        )
      case 'iterations':
        return (
          <PageShell>
            <IterationsPage
              iterationPlans={timeline.iterationPlans}
              timeboxes={timeline.timeboxes}
              sprints={timeline.planSprints}
              projects={timeline.projects}
              projectIterationPlans={timeline.projectIterationPlans}
              onCreatePlan={timeline.createIterationPlan}
              onRenamePlan={timeline.renameIterationPlan}
              onDeletePlan={timeline.deleteIterationPlan}
              onCreateTimebox={timeline.createTimebox}
              onDeleteTimebox={timeline.deleteTimebox}
              onUpdateSprint={timeline.updateSprint}
            />
          </PageShell>
        )
      case 'teams':
        return (
          <PageShell>
            <TeamsPage
              teams={timeline.teams}
              projects={timeline.projects}
              projectId={timeline.projectId}
              projectTeams={timeline.projectTeams}
              features={timeline.allFeatures}
              onCreate={timeline.createTeam}
              onRename={timeline.renameTeam}
              onDelete={timeline.deleteTeam}
              onAssign={timeline.assignTeamToProject}
              onUnassign={timeline.unassignTeamFromProject}
            />
          </PageShell>
        )
      case 'products':
        return (
          <PageShell>
            <ProductsPage
              products={timeline.products}
              projects={timeline.projects}
              projectProducts={timeline.projectProducts}
              projectId={timeline.projectId}
              orphanedProducts={timeline.orphanedProducts}
              features={timeline.allFeatures}
              onCreate={timeline.createProduct}
              onUpdate={timeline.updateProduct}
              onDelete={timeline.deleteProduct}
              onSetProductProjects={timeline.setProductProjectIds}
            />
          </PageShell>
        )
      case 'timeline':
      default:
        return (
          <>
            <div
              data-tour="timeline-main"
              className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            >
              {showChecklist && (
                <GanttSetupChecklist
                  readiness={readiness}
                  onDismiss={() => {
                    dismissSetupChecklist()
                    setOnboarding(loadOnboarding())
                  }}
                  onStartWizard={() => setShowWizard(true)}
                  onNavigate={(page, options) => {
                    navigateToPage(page)
                    if (options?.addFeature && readiness.canAddFeature) {
                      timeline.setShowAddModal(true)
                    }
                  }}
                />
              )}
              <TimelineGrid
                projectId={timeline.projectId}
                calendar={timeline.projectCalendar}
                timelineRows={timeline.timelineRows}
                allFeatures={timeline.allFeatures}
                markers={timeline.markersForProject}
                formattingRules={timeline.formattingRulesForProject}
                scrollToDate={timeline.scrollToDate}
                onScrollToDateHandled={timeline.clearScrollToDate}
                leftColWidth={leftColWidth}
                leftColCollapsed={timeline.layout.leftColCollapsed}
                onLeftColWidthChange={handleLeftColWidthChange}
                onToggleLeftColCollapsed={(expand) => {
                  if (expand === false) {
                    timeline.setLayout({ leftColCollapsed: false })
                  } else if (expand === true) {
                    timeline.setLayout({ leftColCollapsed: true })
                  } else {
                    timeline.setLayout({ leftColCollapsed: !timeline.layout.leftColCollapsed })
                  }
                }}
                onToggleSectionCollapsed={timeline.toggleSectionCollapsed}
                onCollapseAllSections={timeline.collapseAllSections}
                onExpandAllSections={timeline.expandAllSections}
                onMove={timeline.moveFeature}
                selectedFeatureId={timeline.selectedFeatureId}
                onSelectFeature={requestSelectFeature}
                onDeselectFeature={requestDeselectFeature}
                highlightProductId={timeline.filterProductId}
              />
              <Footer
                features={timeline.ganttFeatures}
                crossTeamInfo={timeline.productFocusCrossTeamInfo}
              />
            </div>

            {timeline.selectedFeature && (
              <FeatureDetailPanel
                ref={detailPanelRef}
                feature={timeline.selectedFeature}
                history={history}
                productsForProject={timeline.productsForProject}
                allProducts={timeline.products}
                teamsForProject={timeline.teamsForProject}
                allTeams={timeline.teams}
                allFeatures={timeline.allFeatures}
                actor={timeline.actor}
                onClose={requestDeselectFeature}
                onUpdate={timeline.updateFeature}
                onDelete={timeline.deleteFeature}
                onAddUserStory={timeline.addUserStory}
                onRemoveUserStory={timeline.removeUserStory}
                onAddComment={timeline.addComment}
                onUpdateComment={timeline.updateComment}
                onDeleteComment={timeline.deleteComment}
                onEditPreviewChange={timeline.setFeatureEditPreview}
              />
            )}
          </>
        )
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <TourRunner
        tourId={activeTourId}
        open={Boolean(activeTourId)}
        currentPage={currentPage}
        onNavigate={navigateToPage}
        onClose={handleTourClose}
        onComplete={handleTourComplete}
        onRequestSetup={() => setShowWizard(true)}
      />

      <SetupWizard
        open={showWizard}
        initialUserName={timeline.actor}
        onComplete={handleWizardComplete}
        onSkip={handleWizardSkip}
      />

      <Sidebar
        collapsed={timeline.layout.sidebarCollapsed}
        onToggleCollapsed={() =>
          timeline.setLayout({ sidebarCollapsed: !timeline.layout.sidebarCollapsed })
        }
        currentPage={currentPage}
        onNavigate={navigateTo}
        projects={timeline.projects}
        projectId={timeline.projectId}
        onProjectChange={handleProjectChange}
        teamsForProject={timeline.teamsForProject}
        productsForProject={timeline.productsForProject}
        viewMode={timeline.viewMode}
        filterTeamId={timeline.filterTeamId}
        filterProductId={timeline.filterProductId}
        onViewScopeChange={timeline.setViewScope}
        onTeamFilterChange={timeline.setTeamFilter}
        onProductFocusChange={timeline.setProductFocus}
        actor={timeline.actor}
        onActorChange={timeline.setActor}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          pageTitle={PAGE_TITLES[currentPage] ?? 'Timeline'}
          planLabel={timeline.activePlan?.name}
          focusProduct={timeline.focusedProduct}
          showPlanLabel={currentPage === 'timeline'}
          showFocusLabel={currentPage === 'timeline' && Boolean(timeline.filterProductId)}
          variant={currentPage === 'home' ? 'dark' : 'light'}
          onAddFeature={handleAddFeature}
          onOpenGanttSettings={() => requestProtectedAction(() => timeline.setShowGanttSettings(true))}
          showAddFeature={currentPage === 'timeline'}
          addFeatureDisabled={!readiness.canAddFeature}
          addFeatureHint={
            !readiness.canAddFeature
              ? 'Add a product to this project before creating features.'
              : undefined
          }
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">{renderMainContent()}</div>
      </div>

      <AddFeatureModal
        open={timeline.showAddModal}
        onClose={() => timeline.setShowAddModal(false)}
        onSave={timeline.addFeature}
        teams={timeline.teamsForProject}
        products={timeline.productsForProject}
        defaultProductId={timeline.filterProductId ?? undefined}
        defaultDates={defaultDates}
        canPlanOnGantt={readiness.canAddPlannedFeature}
      />

      <GanttSettingsModal
        open={timeline.showGanttSettings}
        markers={timeline.markersForProject}
        formattingRules={timeline.formattingRulesForProject}
        onClose={() => timeline.setShowGanttSettings(false)}
        onSaveMarkers={(validMarkers) => {
          const prevKeys = new Set(
            timeline.markersForProject.map((m) => `${m.date}|${m.label}`),
          )
          const added = validMarkers.filter((m) => !prevKeys.has(`${m.date}|${m.label}`))
          timeline.saveProjectMarkers(validMarkers)
          if (added.length > 0) {
            timeline.requestScrollToDate(added[added.length - 1].date)
          }
        }}
        onSaveFormattingRules={(rules) => {
          timeline.saveFormattingRules(rules)
        }}
      />
    </div>
  )
}
