import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ImageOff, Link2, Pencil, Trash2 } from 'lucide-react'
import { cn } from 'cn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { Project } from '@/lib/types'
import { hostOf, resolveImage } from './project-utils'

type ViewProps = {
  title: string
  description: string
  url: string
  image_url: string
  visible: boolean
  handle?: ReactNode
  onToggleVisible?: (v: boolean) => void
  onOpen?: () => void
  onDelete?: () => void
  className?: string
}

export function ProjectCardView({
  title,
  description,
  url,
  image_url,
  visible,
  handle,
  onToggleVisible,
  onOpen,
  onDelete,
  className,
}: ViewProps) {
  const img = resolveImage(image_url)
  const Cover = onOpen ? 'button' : 'div'
  return (
    <article
      className={cn(
        'group/card relative flex h-full flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:ring-foreground/25',
        className,
      )}
    >
      <div className={cn('relative transition-opacity', !visible && 'opacity-50')}>
        <Cover
          {...(onOpen ? { type: 'button' as const, onClick: onOpen, 'aria-label': `Editar ${title || 'projeto'}` } : {})}
          className="block aspect-video w-full overflow-hidden bg-muted text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {img ? (
            <img
              src={img}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover/card:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImageOff className="size-6" aria-hidden />
              <span className="text-xs">Sem imagem</span>
            </div>
          )}
        </Cover>
      </div>
      {handle && <div className="absolute left-2 top-2">{handle}</div>}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className={cn('flex flex-1 flex-col gap-2 transition-opacity', !visible && 'opacity-60')}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-heading text-base font-medium">{title || 'Sem título'}</h3>
            {!visible && (
              <Badge variant="secondary" className="shrink-0">
                Oculto
              </Badge>
            )}
          </div>
          <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
            {description || 'Sem descrição.'}
          </p>
          {url && (
            <span className="inline-flex w-fit max-w-full items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Link2 className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{hostOf(url)}</span>
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between border-t pt-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <Switch
              size="sm"
              checked={visible}
              disabled={!onToggleVisible}
              onCheckedChange={(v) => onToggleVisible?.(v)}
              aria-label={`Visível no site: ${title}`}
            />
            {visible ? 'Visível no site' : 'Oculto no site'}
          </label>
          {(onOpen || onDelete) && (
            <div className="flex items-center gap-1">
              {onOpen && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Editar projeto"
                  aria-label={`Editar ${title || 'projeto'}`}
                  onClick={onOpen}
                >
                  <Pencil aria-hidden />
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Excluir projeto"
                  aria-label={`Excluir ${title || 'projeto'}`}
                  onClick={onDelete}
                >
                  <Trash2 aria-hidden />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

type CardProps = {
  project: Project
  onToggleVisible: (p: Project, v: boolean) => void
  onOpen: (p: Project) => void
  onDelete: (p: Project) => void
}

export function SortableProjectCard({ project, onToggleVisible, onOpen, onDelete }: CardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('relative list-none', isDragging && 'z-10 opacity-80 [&>article]:shadow-xl')}
    >
      <ProjectCardView
        {...project}
        onToggleVisible={(v) => onToggleVisible(project, v)}
        onOpen={() => onOpen(project)}
        onDelete={() => onDelete(project)}
        handle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Reordenar ${project.title}. Use espaço e as setas do teclado.`}
            className="flex size-8 cursor-grab touch-none items-center justify-center rounded-md bg-background/85 text-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        }
      />
    </li>
  )
}
