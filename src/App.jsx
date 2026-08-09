import { useMemo, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import TopNav from './components/TopNav'
import TimelineGrid from './components/TimelineGrid'
import Footer from './components/Footer'
import AddFeatureModal from './components/AddFeatureModal'
import GanttSettingsModal from './components/GanttSettingsModal'
import FeatureDetailPanel from './components/FeatureDetailPanel'
import ActorSetup from './components/ActorSetup'
import ProjectsPage from './components/pages/ProjectsPage'
import TeamsPage from './components/pages/TeamsPage'
import ProductsPage from './components/pages/ProductsPage'
import IterationsPage from './components/pages/IterationsPage'
import HomePage from './components/pages/HomePage'
import { PAGE_TITLES } from './brand'
import { useTimelineState } from './hooks/useTimelineState'

export default function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const timeline = useTimelineState()
  const detailPanelRef = useRef(null)

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

  const handleNavigate = (page) => {
    requestProtectedAction(() => setCurrentPage(page))
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

  const renderMainContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            activeProject={timeline.projects.find((p) => p.id === timeline.projectId)}
            onOpenTimeline={() => setCurrentPage('timeline')}
            onConfigureProject={() => setCurrentPage('projects')}
          />
        )
      case 'projects':
        return (
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
        )
      case 'iterations':
        return (
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
        )
      case 'teams':
        return (
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
        )
      case 'products':
        return (
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
        )
      case 'timeline':
      default:
        return (
          <>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
              />
              <Footer features={timeline.ganttFeatures} />
            </div>

            {timeline.selectedFeature && (
              <FeatureDetailPanel
                ref={detailPanelRef}
                feature={timeline.selectedFeature}
                history={history}
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
      <ActorSetup actor={timeline.actor} onSave={timeline.setActor} />

      <Sidebar
        collapsed={timeline.layout.sidebarCollapsed}
        onToggleCollapsed={() =>
          timeline.setLayout({ sidebarCollapsed: !timeline.layout.sidebarCollapsed })
        }
        currentPage={currentPage}
        onNavigate={handleNavigate}
        projects={timeline.projects}
        projectId={timeline.projectId}
        onProjectChange={handleProjectChange}
        teamsForProject={timeline.teamsForProject}
        viewMode={timeline.viewMode}
        filterTeamId={timeline.filterTeamId}
        onViewChange={timeline.setViewFilter}
        actor={timeline.actor}
        onActorChange={timeline.setActor}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          pageTitle={PAGE_TITLES[currentPage] ?? 'Timeline'}
          planLabel={timeline.activePlan?.name}
          showPlanLabel={currentPage === 'timeline'}
          variant={currentPage === 'home' ? 'dark' : 'light'}
          onAddFeature={() => requestProtectedAction(() => timeline.setShowAddModal(true))}
          onOpenGanttSettings={() => requestProtectedAction(() => timeline.setShowGanttSettings(true))}
          showAddFeature={currentPage === 'timeline'}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">{renderMainContent()}</div>
      </div>

      <AddFeatureModal
        open={timeline.showAddModal}
        onClose={() => timeline.setShowAddModal(false)}
        onSave={timeline.addFeature}
        teams={timeline.teamsForProject}
        products={timeline.productsForProject}
        defaultDates={defaultDates}
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
