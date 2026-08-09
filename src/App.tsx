import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { TodayPage } from './pages/TodayPage'
import { PlanPage } from './pages/PlanPage'
import { IntelligencePage } from './pages/IntelligencePage'
import { WorkDetailPage, WorkPage } from './pages/WorkPage'
import { MapPage } from './pages/MapPage'
import { AgentDetailPage, AgentsPage } from './pages/AgentsPage'
import { CommunicationPage } from './pages/CommunicationPage'
import { RecordPage } from './pages/detail/RecordPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<TodayPage />} />
          <Route path="plan" element={<PlanPage />} />
          <Route path="intelligence" element={<IntelligencePage />} />
          <Route path="work" element={<WorkPage />} />
          <Route path="work/:id" element={<WorkDetailPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="agents/:id" element={<AgentDetailPage />} />
          <Route path="communication" element={<CommunicationPage />} />
          <Route path="records/:type/:id" element={<RecordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
