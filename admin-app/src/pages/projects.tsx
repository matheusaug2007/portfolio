import { useCallback, useEffect, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { FolderOpen, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/lib/types'
import { SortableProjectCard } from '@/components/projects/project-card'
import { ProjectSheet } from '@/components/projects/project-sheet'
import type { ProjectDraft } from '@/components/projects/project-utils'

const errMsg = (e: { message: string }) => 'Erro: ' + e.message

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('projects').select('*').order('position')
    if (error) toast.error(errMsg(error))
    else setProjects(data as Project[])
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setSheetOpen(true)
  }
  const openEdit = (p: Project) => {
    setEditing(p)
    setSheetOpen(true)
  }

  const toggleVisible = async (p: Project, visible: boolean) => {
    setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, visible } : x)))
    const { error } = await supabase.from('projects').update({ visible }).eq('id', p.id)
    if (error) {
      setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, visible: p.visible } : x)))
      toast.error(errMsg(error))
    }
  }

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const prev = projects
    const from = prev.findIndex((p) => p.id === active.id)
    const to = prev.findIndex((p) => p.id === over.id)
    const next = arrayMove(prev, from, to).map((p, i) => ({ ...p, position: i + 1 }))
    setProjects(next)
    const changed = next.filter((p, i) => prev.find((o) => o.id === p.id)?.position !== i + 1)
    const results = await Promise.all(
      changed.map((p) => supabase.from('projects').update({ position: p.position }).eq('id', p.id)),
    )
    const failed = results.find((r) => r.error)
    if (failed?.error) {
      setProjects(prev)
      toast.error(errMsg(failed.error))
      void load()
    } else toast.success('Ordem atualizada.')
  }

  const save = async (draft: ProjectDraft) => {
    setSaving(true)
    const res = editing
      ? await supabase.from('projects').update(draft).eq('id', editing.id)
      : await supabase.from('projects').insert({ ...draft, position: projects.length + 1 })
    setSaving(false)
    if (res.error) return void toast.error(errMsg(res.error))
    toast.success('Projeto salvo!')
    setSheetOpen(false)
    await load()
  }

  const remove = async (p: Project) => {
    const { error } = await supabase.from('projects').delete().eq('id', p.id)
    if (error) return void toast.error(errMsg(error))
    toast.success('Projeto excluído.')
    setSheetOpen(false)
    await load()
  }

  const visibleCount = projects.filter((p) => p.visible).length

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground">Arraste pela alça para reordenar como aparecem no site.</p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <Badge variant="secondary">
              {projects.length} {projects.length === 1 ? 'projeto' : 'projetos'} · {visibleCount}{' '}
              {visibleCount === 1 ? 'visível' : 'visíveis'}
            </Badge>
          )}
          <Button onClick={openNew}>
            <Plus aria-hidden /> Novo projeto
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando projetos">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-3 rounded-xl p-0 ring-1 ring-foreground/10">
              <Skeleton className="aspect-video w-full rounded-b-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FolderOpen className="size-6" aria-hidden />
          </span>
          <h2 className="font-heading text-lg font-medium">Nenhum projeto ainda</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Adicione seu primeiro projeto para mostrá-lo no portfólio.
          </p>
          <Button onClick={openNew}>
            <Plus aria-hidden /> Novo projeto
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={projects.map((p) => p.id)} strategy={rectSortingStrategy}>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((p) => (
                <SortableProjectCard key={p.id} project={p} onToggleVisible={toggleVisible} onOpen={openEdit} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <ProjectSheet
        open={sheetOpen}
        project={editing}
        saving={saving}
        onClose={() => setSheetOpen(false)}
        onSave={save}
        onDelete={remove}
      />
    </div>
  )
}
