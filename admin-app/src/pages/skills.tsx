import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, Cpu } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { supabase } from '@/lib/supabase'
import type { Skill } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const MAX_NAME = 40

function errMsg(err: unknown) {
  return 'Erro: ' + (err instanceof Error ? err.message : String((err as { message?: string })?.message ?? err))
}

type ChipProps = {
  skill: Skill
  onRename: (s: Skill, name: string) => void
  onToggle: (s: Skill, visible: boolean) => void
  onDelete: (s: Skill) => void
}

function SkillChip({ skill, onRename, onToggle, onDelete }: ChipProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: skill.id })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(skill.name)
  const cancelled = useRef(false)

  function commit() {
    if (cancelled.current) {
      cancelled.current = false
      return
    }
    setEditing(false)
    const v = draft.trim()
    if (!v) {
      toast.error('O nome é obrigatório.')
      return
    }
    if (v !== skill.name) onRename(skill, v)
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-1.5 rounded-full border bg-card py-1 pr-2 pl-1 text-sm shadow-xs transition-opacity',
        !skill.visible && 'opacity-50',
        isDragging && 'relative z-10 opacity-90 shadow-lg ring-2 ring-primary/40',
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reordenar ${skill.name}`}
        className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>

      {editing ? (
        <Input
          autoFocus
          value={draft}
          maxLength={MAX_NAME}
          aria-label="Nome da tecnologia"
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              cancelled.current = true
              setEditing(false)
              setDraft(skill.name)
            }
          }}
          className="h-7 w-36"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(skill.name)
            setEditing(true)
          }}
          title="Clique para renomear"
          className="max-w-48 truncate rounded px-1 font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {skill.name}
        </button>
      )}

      <Switch
        size="sm"
        checked={skill.visible}
        onCheckedChange={(v) => onToggle(skill, v)}
        aria-label={`${skill.visible ? 'Ocultar' : 'Mostrar'} ${skill.name}`}
      />
      <button
        type="button"
        onClick={() => onDelete(skill)}
        aria-label={`Excluir ${skill.name}`}
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Trash2 className="size-3.5" aria-hidden />
      </button>
    </li>
  )
}

export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[] | null>(null)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [toDelete, setToDelete] = useState<Skill | null>(null)
  const skillsRef = useRef<Skill[]>([])
  skillsRef.current = skills ?? []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('skills').select('*').order('position')
    if (error) {
      toast.error(errMsg(error))
      setSkills([])
      return
    }
    setSkills(data as Skill[])
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const v = newName.trim()
    if (!v) return
    if (v.length > MAX_NAME) return toast.error(`O nome deve ter no máximo ${MAX_NAME} caracteres.`)
    setAdding(true)
    const { error } = await supabase.from('skills').insert({ name: v, position: skillsRef.current.length + 1 })
    setAdding(false)
    if (error) return toast.error(errMsg(error))
    setNewName('')
    toast.success('Adicionada!')
    void load()
  }

  async function patch(s: Skill, changes: Partial<Skill>) {
    const prev = skillsRef.current
    setSkills(prev.map((x) => (x.id === s.id ? { ...x, ...changes } : x)))
    const { error } = await supabase.from('skills').update(changes).eq('id', s.id)
    if (error) {
      setSkills(prev)
      toast.error(errMsg(error))
    }
  }

  async function remove() {
    const s = toDelete
    if (!s) return
    setToDelete(null)
    const { error } = await supabase.from('skills').delete().eq('id', s.id)
    if (error) return toast.error(errMsg(error))
    toast.success('Excluída.')
    void load()
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const prev = skillsRef.current
    const from = prev.findIndex((s) => s.id === active.id)
    const to = prev.findIndex((s) => s.id === over.id)
    if (from < 0 || to < 0) return
    const next = arrayMove(prev, from, to).map((s, i) => ({ ...s, position: i + 1 }))
    setSkills(next)
    const changed = next.filter((s, i) => prev[i]?.id !== s.id || prev.find((p) => p.id === s.id)?.position !== s.position)
    const results = await Promise.all(
      changed.map((s) => supabase.from('skills').update({ position: s.position }).eq('id', s.id)),
    )
    const failed = results.find((r) => r.error)
    if (failed?.error) {
      setSkills(prev)
      toast.error(errMsg(failed.error))
    }
  }

  const visibleCount = skills?.filter((s) => s.visible).length ?? 0

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Tecnologias</h1>
        <p className="text-muted-foreground">
          Arraste para reordenar, clique no nome para renomear e use o interruptor para ocultar do site.
        </p>
      </header>

      <form onSubmit={add} className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={MAX_NAME}
          placeholder="Nova tecnologia"
          aria-label="Nova tecnologia"
          className="h-9"
          required
        />
        <Button type="submit" size="lg" disabled={adding || !newName.trim()}>
          <Plus aria-hidden /> Adicionar
        </Button>
      </form>

      <Card>
        <CardContent className="space-y-4">
          {skills === null ? (
            <div className="flex flex-wrap gap-2" aria-busy="true">
              {[28, 20, 32, 24, 36, 22, 30, 26].map((w, i) => (
                <Skeleton key={i} className="h-9 rounded-full" style={{ width: `${w * 4}px` }} />
              ))}
            </div>
          ) : skills.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <Cpu className="size-8" aria-hidden />
              <p className="font-medium text-foreground">Nenhuma tecnologia ainda</p>
              <p className="text-sm">Adicione a primeira usando o campo acima.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {skills.length} {skills.length === 1 ? 'tecnologia' : 'tecnologias'} · {visibleCount}{' '}
                {visibleCount === 1 ? 'visível' : 'visíveis'}
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={skills.map((s) => s.id)} strategy={rectSortingStrategy}>
                  <ul className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <SkillChip
                        key={s.id}
                        skill={s}
                        onRename={(sk, name) => patch(sk, { name })}
                        onToggle={(sk, visible) => patch(sk, { visible })}
                        onDelete={setToDelete}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tecnologia?</AlertDialogTitle>
            <AlertDialogDescription>
              “{toDelete?.name}” será removida do site. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
