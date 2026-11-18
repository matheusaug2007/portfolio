import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useRoute } from '@/hooks/use-route'
import { useSession } from '@/hooks/use-session'
import { HomePage } from '@/pages/home'
import { LoginPage } from '@/pages/login'
import { ProjectsPage } from '@/pages/projects'
import { SectionsPage } from '@/pages/sections'
import { SkillsPage } from '@/pages/skills'
import { TextsPage } from '@/pages/texts'

export default function App() {
  const session = useSession()
  const [route, go] = useRoute()

  // Tema escuro por padrão (também na tela de login).
  if (localStorage.getItem('admin-theme') !== 'light') document.documentElement.classList.add('dark')

  let content
  if (session === undefined) {
    content = <div className="bg-background min-h-svh" />
  } else if (session === null) {
    content = <LoginPage />
  } else {
    content = (
      <AppShell route={route} go={go} email={session.user.email}>
        {route === 'home' && <HomePage go={go} />}
        {route === 'texts' && <TextsPage />}
        {route === 'sections' && <SectionsPage />}
        {route === 'projects' && <ProjectsPage />}
        {route === 'skills' && <SkillsPage />}
      </AppShell>
    )
  }

  return (
    <TooltipProvider>
      {content}
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  )
}
