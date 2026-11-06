import { useEffect, useState } from 'react'
import {
  ArrowUpRight, BarChart3, Cpu, ExternalLink, FolderKanban, Globe, Type,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Route } from '@/hooks/use-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type Stats = {
  projects: number
  projectsVisible: number
  skills: number
  skillsVisible: number
  texts: number
}
type RecentText = { key: string; label: string; updated_at: string }

const SITE_URL = 'https://www.matheuscode.dev.br/'

async function count(table: string, onlyVisible = false) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (onlyVisible) q = q.eq('visible', true)
  const { count: c, error } = await q
  if (error) throw error
  return c ?? 0
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export function HomePage({ go }: { go: (r: Route) => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<RecentText[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [projects, projectsVisible, skills, skillsVisible, texts] = await Promise.all([
          count('projects'),
          count('projects', true),
          count('skills'),
          count('skills', true),
          count('site_content'),
        ])
        if (alive) setStats({ projects, projectsVisible, skills, skillsVisible, texts })
      } catch {
        if (alive) setFailed(true)
      }
      const { data, error } = await supabase
        .from('site_content')
        .select('key,label,updated_at')
        .not('updated_at', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(3)
      if (alive && !error && data) setRecent(data as RecentText[])
    })()
    return () => {
      alive = false
    }
  }, [])

  const cards = stats && [
    { label: 'Projetos', value: stats.projects, hint: `${stats.projectsVisible} visíveis`, icon: FolderKanban },
    { label: 'Projetos visíveis', value: stats.projectsVisible, hint: `de ${stats.projects} no total`, icon: Globe },
    { label: 'Tecnologias', value: stats.skills, hint: `${stats.skillsVisible} visíveis`, icon: Cpu },
    { label: 'Textos do site', value: stats.texts, hint: 'campos editáveis', icon: Type },
  ]

  const actions: { route: Route; title: string; desc: string; icon: typeof Type }[] = [
    { route: 'texts', title: 'Editar textos', desc: 'Títulos, frases e descrições do site.', icon: Type },
    { route: 'projects', title: 'Gerenciar projetos', desc: 'Adicionar, ordenar e ocultar projetos.', icon: FolderKanban },
    { route: 'skills', title: 'Gerenciar tecnologias', desc: 'Organize as tecnologias exibidas.', icon: Cpu },
  ]

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{greeting()}!</h1>
        <p className="text-muted-foreground">Visão geral do conteúdo do seu portfólio.</p>
      </header>

      {failed && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível carregar as estatísticas.
        </p>
      )}

      <section aria-label="Estatísticas" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards
          ? cards.map(({ label, value, hint, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                </CardContent>
              </Card>
            ))
          : failed
            ? null
            : Array.from({ length: 4 }, (_, i) => (
                <Card key={i}>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
      </section>

      <section aria-label="Ações rápidas" className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Ações rápidas</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {actions.map(({ route, title, desc, icon: Icon }) => (
            <button
              key={route}
              type="button"
              onClick={() => go(route)}
              className="group rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full transition-colors group-hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <ArrowUpRight
                      className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </div>
                  <CardTitle className="pt-2">{title}</CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
              </Card>
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Card className="h-full transition-colors group-hover:bg-muted/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ver site</CardTitle>
                <ExternalLink className="size-4 text-muted-foreground" aria-hidden />
              </div>
              <CardDescription>Abrir o portfólio publicado em uma nova aba.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm font-medium text-primary">www.matheuscode.dev.br</CardContent>
          </Card>
        </a>

        <Card className="border border-dashed bg-muted/30">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="size-4" aria-hidden /> Analytics (Cloudflare)
              </CardTitle>
              <Badge variant="secondary">Em breve</Badge>
            </div>
            <CardDescription>Visitas e desempenho do site aparecerão aqui em uma versão futura.</CardDescription>
          </CardHeader>
        </Card>
      </section>

      {recent.length > 0 && (
        <section aria-label="Textos atualizados recentemente" className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Textos atualizados recentemente
          </h2>
          <Card>
            <CardContent>
              <ul className="divide-y">
                {recent.map((t) => (
                  <li key={t.key} className="flex items-center justify-between gap-4 py-2 text-sm first:pt-0 last:pb-0">
                    <span className="truncate font-medium">{t.label}</span>
                    <time dateTime={t.updated_at} className="shrink-0 text-xs text-muted-foreground">
                      {new Date(t.updated_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </time>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
