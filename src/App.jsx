import { useMemo, useState } from 'react'
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
import { useTimelineState } from './hooks/useTimelineState'

export default function App() {
  const [viewMode, setViewMode] = useState('current')
  const [currentPage, setCurrentPage] = useState('timeline')
  const timeline = useTimelineState()

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
      case 'projects':
        return (
          <ProjectsPage
            projects={timeline.projects}
            teams={timeline.teams}
            projectTeams={timeline.projectTeams}
            features={timeline.allFeatures}
            projectId={timeline.projectId}
            onSelectProject={timeline.setProjectId}
            onCreate={timeline.createProject}
            onRename={timeline.renameProject}
            onDelete={timeline.deleteProject}
            onSetProjectTeams={timeline.setProjectTeamIds}
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
                timelineRows={timeline.timelineRows}
                markers={timeline.markersForProject}
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
                onMove={timeline.moveFeature}
                selectedFeatureId={timeline.selectedFeatureId}
                onSelectFeature={timeline.setSelectedFeatureId}
                onDeselectFeature={() => timeline.setSelectedFeatureId(null)}
              />
              <Footer features={timeline.features} />
            </div>

            {timeline.selectedFeature && (
              <FeatureDetailPanel
                feature={timeline.selectedFeature}
                history={history}
                teamsForProject={timeline.teamsForProject}
                allTeams={timeline.teams}
                onClose={() => timeline.setSelectedFeatureId(null)}
                onUpdate={timeline.updateFeature}
                onDelete={timeline.deleteFeature}
                onAddUserStory={timeline.addUserStory}
                onRemoveUserStory={timeline.removeUserStory}
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
        onNavigate={setCurrentPage}
        projects={timeline.projects}
        projectId={timeline.projectId}
        onProjectChange={timeline.setProjectId}
        teamsForProject={timeline.teamsForProject}
        teamViewMode={timeline.teamViewMode}
        onTeamViewModeChange={timeline.setTeamViewMode}
        filterTeamId={timeline.filterTeamId}
        onFilterTeamChange={timeline.setFilterTeamId}
        actor={timeline.actor}
        onActorChange={timeline.setActor}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          projectName={timeline.activeProject?.name}
          onAddFeature={() => timeline.setShowAddModal(true)}
          onOpenGanttSettings={() => timeline.setShowGanttSettings(true)}
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
        onClose={() => timeline.setShowGanttSettings(false)}
        onSave={(validMarkers) => {
          const prevKeys = new Set(
            timeline.markersForProject.map((m) => `${m.date}|${m.label}`),
          )
          const added = validMarkers.filter((m) => !prevKeys.has(`${m.date}|${m.label}`))
          timeline.saveProjectMarkers(validMarkers)
          timeline.setShowGanttSettings(false)
          if (added.length > 0) {
            timeline.requestScrollToDate(added[added.length - 1].date)
          }
        }}
      />
    </div>
  )
}
