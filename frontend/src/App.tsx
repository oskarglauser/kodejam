import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { ProjectSetup } from './features/project/ProjectSetup'
import { Layout } from './components/Layout'
import { useProjectStore } from './stores/projectStore'
import { api } from './services/api'

function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const { setCurrentProject, loadPages } = useProjectStore()

  useEffect(() => {
    if (!id) return
    api.getProject(id).then((project) => {
      setCurrentProject(project)
      loadPages(project.id)
    })
  }, [id])

  return <Layout />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectSetup />} />
        <Route path="/project/:id" element={<ProjectPage />} />
      </Routes>
    </BrowserRouter>
  )
}
