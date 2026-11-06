import { useEffect, useRef, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { IMAGE_EXT, IMAGES_BUCKET, MAX_IMAGE_BYTES, supabase } from '@/lib/supabase'
import type { Project } from '@/lib/types'
import { ImageDropzone } from './image-dropzone'
import { ProjectCardView } from './project-card'
import { LIMITS, validateDraft, type ProjectDraft } from './project-utils'

const EMPTY: ProjectDraft = { title: '', description: '', url: '', image_url: '', visible: true }

type Props = {
  open: boolean
  /** null = creating a new project */
  project: Project | null
  saving: boolean
  onClose: () => void
  onSave: (draft: ProjectDraft) => Promise<void>
  onDelete: (p: Project) => Promise<void>
}

const toDraft = (p: Project | null): ProjectDraft =>
  p
    ? { title: p.title, description: p.description, url: p.url, image_url: p.image_url, visible: p.visible }
    : EMPTY

export function ProjectSheet({ open, project, saving, onClose, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<ProjectDraft>(EMPTY)
  const [initial, setInitial] = useState<ProjectDraft>(EMPTY)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (open) {
      const d = toDraft(project)
      setDraft(d)
      setInitial(d)
    }
  }, [open, project])

  useEffect(() => () => window.clearInterval(timer.current), [])

  const dirty = (Object.keys(draft) as (keyof ProjectDraft)[]).some((k) => draft[k] !== initial[k])
  const set = <K extends keyof ProjectDraft>(k: K, v: ProjectDraft[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const requestClose = () => {
    if (uploading) return
    if (dirty) setConfirmDiscard(true)
    else onClose()
  }

  const upload = async (f: File) => {
    const ext = IMAGE_EXT[f.type]
    if (!ext) return void toast.error('Use JPG, PNG ou WebP.')
    if (f.size > MAX_IMAGE_BYTES) return void toast.error('A imagem passa de 2 MB.')
    setUploading(true)
    setProgress(8)
    timer.current = window.setInterval(() => setProgress((p) => Math.min(p + (95 - p) * 0.15, 95)), 150)
    const path = 'projects/' + crypto.randomUUID() + '.' + ext
    const { error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(path, f, { contentType: f.type, upsert: false })
    window.clearInterval(timer.current)
    if (error) {
      setUploading(false)
      return void toast.error('Erro: ' + error.message)
    }
    setProgress(100)
    set('image_url', supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path).data.publicUrl)
    setUploading(false)
    toast.success('Imagem enviada. Clique em Salvar para aplicar.')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateDraft(draft)
    if (err) return void toast.error(err)
    await onSave({
      title: draft.title.trim(),
      description: draft.description.trim(),
      url: draft.url.trim(),
      image_url: draft.image_url.trim(),
      visible: draft.visible,
    })
  }

  const isNew = !project

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && requestClose()}>
        <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-xl" showCloseButton>
          <SheetHeader className="border-b pr-12">
            <SheetTitle>{isNew ? 'Novo projeto' : 'Editar projeto'}</SheetTitle>
            <SheetDescription>
              {isNew ? 'Preencha os dados para adicionar um projeto ao portfólio.' : project?.title}
            </SheetDescription>
          </SheetHeader>

          <form id="project-form" onSubmit={submit} className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="p-title">Nome</Label>
              <Input
                id="p-title"
                value={draft.title}
                maxLength={LIMITS.title}
                placeholder="Nome do projeto"
                required
                onChange={(e) => set('title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="p-desc">Descrição</Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {draft.description.length}/{LIMITS.description}
                </span>
              </div>
              <Textarea
                id="p-desc"
                rows={4}
                value={draft.description}
                maxLength={LIMITS.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-url">Link do projeto</Label>
              <Input
                id="p-url"
                type="url"
                value={draft.url}
                maxLength={LIMITS.url}
                placeholder="https://..."
                required
                onChange={(e) => set('url', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Imagem</Label>
              <ImageDropzone
                value={draft.image_url}
                uploading={uploading}
                progress={progress}
                onFile={upload}
                onRemove={() => set('image_url', '')}
              />
              <Input
                aria-label="Link da imagem"
                value={draft.image_url}
                maxLength={LIMITS.image}
                placeholder="ou cole o link da imagem"
                onChange={(e) => set('image_url', e.target.value)}
              />
            </div>

            <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span>
                <span className="block text-sm font-medium">Visível no site</span>
                <span className="block text-xs text-muted-foreground">Projetos ocultos não aparecem no portfólio.</span>
              </span>
              <Switch checked={draft.visible} onCheckedChange={(v) => set('visible', v)} />
            </label>

            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prévia do card</p>
              <div className="max-w-sm">
                <ProjectCardView {...draft} />
              </div>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2 border-t p-4">
            {!isNew && (
              <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)} disabled={saving}>
                <Trash2 aria-hidden /> Excluir
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" onClick={requestClose}>
                Cancelar
              </Button>
              <Button type="submit" form="project-form" disabled={saving || uploading || (!isNew && !dirty)}>
                {saving && <Loader2 className="animate-spin" aria-hidden />}
                {isNew ? 'Criar projeto' : 'Salvar'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>Você tem alterações não salvas. Se sair agora, elas serão perdidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmDiscard(false)
                onClose()
              }}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir o projeto "{project?.title}"? Isso não pode ser desfeito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                if (!project) return
                setDeleting(true)
                await onDelete(project)
                setDeleting(false)
                setConfirmDelete(false)
              }}
            >
              {deleting && <Loader2 className="animate-spin" aria-hidden />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
