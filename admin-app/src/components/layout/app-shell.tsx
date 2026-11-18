import { ExternalLink, FileText, FolderKanban, LayoutDashboard, LayoutList, LogOut, Moon, Sparkles, Sun } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import type { Route } from '@/hooks/use-route'
import { supabase } from '@/lib/supabase'

const NAV: { route: Route; label: string; icon: typeof FileText }[] = [
  { route: 'home', label: 'Visão geral', icon: LayoutDashboard },
  { route: 'texts', label: 'Textos', icon: FileText },
  { route: 'sections', label: 'Seções', icon: LayoutList },
  { route: 'projects', label: 'Projetos', icon: FolderKanban },
  { route: 'skills', label: 'Tecnologias', icon: Sparkles },
]

const TITLES: Record<Route, string> = {
  home: 'Visão geral',
  texts: 'Textos do site',
  sections: 'Seções do site',
  projects: 'Projetos',
  skills: 'Tecnologias',
}

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('admin-theme') !== 'light')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('admin-theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, () => setDark((d) => !d)] as const
}

export function AppShell({
  route,
  go,
  email,
  children,
}: {
  route: Route
  go: (r: Route) => void
  email?: string
  children: ReactNode
}) {
  const [dark, toggleTheme] = useTheme()

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
              M
            </div>
            <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold">Matheus.dev</span>
              <span className="text-muted-foreground truncate text-xs">{email ?? 'Painel'}</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Conteúdo</SidebarGroupLabel>
            <SidebarMenu>
              {NAV.map(({ route: r, label, icon: Icon }) => (
                <SidebarMenuItem key={r}>
                  <SidebarMenuButton isActive={route === r} tooltip={label} onClick={() => go(r)}>
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Ver site"
                render={<a href="/" target="_blank" rel="noopener noreferrer" />}
              >
                <ExternalLink />
                <span>Ver site</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Sair" onClick={() => supabase.auth.signOut()}>
                <LogOut />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
          <SidebarTrigger />
          <h1 className="text-sm font-medium">{TITLES[route]}</h1>
          <div className="ml-auto">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
              {dark ? <Sun /> : <Moon />}
            </Button>
          </div>
        </header>
        <div className={`mx-auto w-full ${route === 'texts' ? 'max-w-7xl' : 'max-w-5xl'} flex-1 p-4 md:p-8`}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
