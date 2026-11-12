import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, EyeOff, LayoutList } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Section } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

// Blocos que ficam dentro de outra seção (aparecem com recuo na lista).
const CHILD_OF: Record<string, string> = { about_facts: 'about', about_skills: 'about' }

function errMsg(err: unknown) {
  return 'Erro: ' + (err instanceof Error ? err.message : String((err as { message?: string })?.message ?? err))
}

export function SectionsPage() {
  const [sections, setSections] = useState<Section[] | null>(null)
  const [missing, setMissing] = useState(false)
  const ref = useRef<Section[]>([])
  ref.current = sections ?? []

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('secoes').select('*').order('posicao')
    if (error) {
      // Tabela ainda não criada no banco (migração não rodada).
      setMissing(true)
      setSections([])
      if (!/relation|schema cache|does not exist/i.test(error.message)) toast.error(errMsg(error))
      return
    }
    setMissing(false)
    setSections(data as Section[])
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function toggle(s: Section, visivel: boolean) {
    const prev = ref.current
    setSections(prev.map((x) => (x.chave === s.chave ? { ...x, visivel } : x)))
    const { error } = await supabase.from('secoes').update({ visivel }).eq('chave', s.chave)
    if (error) {
      setSections(prev)
      return void toast.error(errMsg(error))
    }
    toast.success(visivel ? `“${s.nome}” voltou ao site.` : `“${s.nome}” foi ocultada do site.`)
  }

  const hiddenCount = sections?.filter((s) => !s.visivel).length ?? 0

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Seções</h1>
        <p className="text-muted-foreground">
          Use o interruptor para mostrar ou ocultar partes do site. Nada é apagado: é só desligar e ligar de novo.
          A mudança vale na hora para quem abrir o site.
        </p>
      </header>

      {missing && (
        <Card className="border-destructive/40">
          <CardContent className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
            <div className="space-y-1 text-sm">
              <p className="font-medium">A tabela de seções ainda não existe no banco.</p>
              <p className="text-muted-foreground">
                Rode o arquivo <code>admin-app/migrations/2026-11-12_sections_and_editable_texts.sql</code> no SQL Editor
                do Supabase e recarregue esta página.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-1">
          {sections === null ? (
            <div className="space-y-3" aria-busy="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : sections.length === 0 ? (
            !missing && (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                <LayoutList className="size-8" aria-hidden />
                <p className="font-medium text-foreground">Nenhuma seção cadastrada</p>
              </div>
            )
          ) : (
            <>
              <p className="pb-2 text-sm text-muted-foreground" aria-live="polite">
                {sections.length} seções · {hiddenCount === 0 ? 'todas visíveis' : `${hiddenCount} oculta${hiddenCount > 1 ? 's' : ''}`}
              </p>
              <ul className="divide-y">
                {sections.map((s) => (
                  <li
                    key={s.chave}
                    className={cn('flex items-center justify-between gap-4 py-3', CHILD_OF[s.chave] && 'pl-6 sm:pl-8')}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className={cn('font-medium', !s.visivel && 'text-muted-foreground line-through')}>{s.nome}</p>
                        {!s.visivel && (
                          <Badge variant="secondary" className="gap-1 text-[10px]">
                            <EyeOff className="size-3" aria-hidden /> oculta
                          </Badge>
                        )}
                      </div>
                      {s.descricao && <p className="text-sm text-muted-foreground">{s.descricao}</p>}
                    </div>
                    <Switch
                      checked={s.visivel}
                      onCheckedChange={(v) => void toggle(s, v)}
                      aria-label={`${s.visivel ? 'Ocultar' : 'Mostrar'} ${s.nome}`}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Para ocultar só um projeto ou uma tecnologia, use as páginas <strong>Projetos</strong> e{' '}
        <strong>Tecnologias</strong>: lá cada item tem o seu interruptor e o botão de excluir.
      </p>
    </div>
  )
}
