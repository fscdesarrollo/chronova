import { useState } from 'react'
import Sidebar from './components/Sidebar'
import TopNav from './components/TopNav'
import TimelineGrid from './components/TimelineGrid'
import Footer from './components/Footer'
import { features as initialFeatures } from './data'

export default function App() {
  const [viewMode, setViewMode] = useState('current')
  const [features, setFeatures] = useState(initialFeatures)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav viewMode={viewMode} onViewModeChange={setViewMode} />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <TimelineGrid features={features} setFeatures={setFeatures} />

          <Footer features={features} />
        </div>
      </div>
    </div>
  )
}
