import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, Link2, Loader2, Save, Shapes, Sparkles, Undo2, User, Undo } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SiteText } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { SitePreview } from '@/components/texts/site-preview'
import { cn } from '@/lib/utils'

const MAX_LEN = 2000

type GroupId = 'hero' | 'about' | 'links' | 'other'

const GROUPS: { id: GroupId; title: string; description: string; icon: LucideIcon }[] = [
  { id: 'hero', title: 'Início (Hero)', description: 'Primeira impressão: status, frases animadas e descrição.', icon: Sparkles },
  { id: 'about', title: 'Sobre mim', description: 'Título e parágrafos da seção sobre.', icon: User },
  { id: 'links', title: 'Contato e links', description: 'Links externos devem começar com https://.', icon: Link2 },
  { id: 'other', title: 'Outros textos', description: 'Demais textos do site.', icon: Shapes },
]

function groupOf(key: string): GroupId {
  if (key.endsWith('_url') || /^(contact|link|social)/.test(key) || /(email|whatsapp|linkedin|github)/.test(key)) return 'links'
  if (key.startsWith('hero')) return 'hero'
  if (key.startsWith('about')) return 'about'
  return 'other'
}

const isLong = (r: SiteText) => r.value.length > 70 || /phrases|_p\d|pitch|desc/.test(r.key)

function validate(key: string, value: string): string | null {
  const v = value.trim()
  if (key.endsWith('_url') && v && !/^https:\/\//i.test(v)) return 'Links precisam começar com https://'
  return null
}

function PhrasesPreview({ value }: { value: string }) {
  const lines = value.split('\n').map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return null
  return (
    <div className="rounded-lg border border-dashed bg-muted/40 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
      <ul className="space-y-1.5">
        {lines.map((line, i) => {
          const parts = line.split('|')
          return (
            <li key={i} className="text-sm">
              {parts.map((p, j) =>
                j % 2 === 1 && j < parts.length - 1 ? (
                  <span key={j} className="font-semibold text-primary">{p}</span>
                ) : (
                  <span key={j}>{p}</span>
                ),
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Field({
  row, value, dirty, error, onChange, onRevert,
}: {
  row: SiteText
  value: string
  dirty: boolean
  error: string | null
  onChange: (v: string) => void
  onRevert: () => void
}) {
  const id = `field-${row.key}`
  const long = isLong(row)
  const errId = `${id}-error`
  const common = {
    id,
    'data-key': row.key,
    value,
    maxLength: MAX_LEN,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errId : undefined,
  }
  let control: ReactNode
  if (long) {
    control = (
      <Textarea
        {...common}
        rows={row.key === 'hero_phrases' ? 5 : 4}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-24 resize-y"
      />
    )
  } else {
    control = <Input {...common} type="text" onChange={(e) => onChange(e.target.value)} />
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={id}>{row.label}</Label>
          {dirty && <Badge variant="secondary" className="text-[10px]">modificado</Badge>}
        </div>
        {dirty && (
          <Button type="button" variant="ghost" size="xs" onClick={onRevert} className="text-muted-foreground">
            <Undo2 className="size-3.5" /> restaurar
          </Button>
        )}
      </div>
      {control}
      <div className="flex items-start justify-between gap-2">
        {error ? (
          <p id={errId} role="alert" className="text-xs text-destructive">{error}</p>
        ) : row.key === 'hero_phrases' ? (
          <p className="text-xs text-muted-foreground">Uma frase por linha. Use |palavra| para destacar.</p>
        ) : <span />}
        {long && (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{value.length}/{MAX_LEN}</span>
        )}
      </div>
      {row.key === 'hero_phrases' && <PhrasesPreview value={value} />}
    </div>
  )
}

export function TextsPage() {
  const [rows, setRows] = useState<SiteText[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(() => localStorage.getItem('admin-preview') !== 'off')
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')

  useEffect(() => { localStorage.setItem('admin-preview', showPreview ? 'on' : 'off') }, [showPreview])

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('site_content').select('key,label,value,sort').order('sort')
    if (error) {
      toast.error('Erro: ' + error.message)
      setLoading(false)
      return
    }
    const list = (data ?? []) as SiteText[]
    setRows(list)
    setDrafts(Object.fromEntries(list.map((r) => [r.key, r.value])))
    setErrors({})
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const dirtyKeys = useMemo(
    () => rows.filter((r) => (drafts[r.key] ?? r.value) !== r.value).map((r) => r.key),
    [rows, drafts],
  )
  const dirtyCount = dirtyKeys.length

  const save = useCallback(async () => {
    if (saving || !dirtyCount) return
    const errs: Record<string, string> = {}
    for (const k of dirtyKeys) {
      const e = validate(k, drafts[k])
      if (e) errs[k] = e
    }
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast.error('Erro: Links precisam começar com https://')
      return
    }
    setSaving(true)
    try {
      for (const k of dirtyKeys) {
        const { error } = await supabase
          .from('site_content')
          .update({ value: drafts[k].trim(), updated_at: new Date().toISOString() })
          .eq('key', k)
        if (error) throw error
      }
      toast.success('Textos salvos!')
      await load()
    } catch (err) {
      toast.error('Erro: ' + (err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err)))
    } finally {
      setSaving(false)
    }
  }, [saving, dirtyCount, dirtyKeys, drafts, load])

  // Ctrl/Cmd+S
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // beforeunload warning
  useEffect(() => {
    if (!dirtyCount) return
    const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [dirtyCount])

  const setDraft = (key: string, v: string) => {
    setDrafts((d) => ({ ...d, [key]: v }))
    setErrors((e) => { if (!e[key]) return e; const { [key]: _, ...rest } = e; return rest })
  }
  const revert = (key: string) => {
    const orig = rows.find((r) => r.key === key)?.value ?? ''
    setDraft(key, orig)
  }
  const discardAll = () => {
    setDrafts(Object.fromEntries(rows.map((r) => [r.key, r.value])))
    setErrors({})
  }

  const grouped = useMemo(() => {
    const map: Record<GroupId, SiteText[]> = { hero: [], about: [], links: [], other: [] }
    rows.forEach((r) => map[groupOf(r.key)].push(r))
    return map
  }, [rows])

  const previewContent = useMemo(() => {
    const out: Record<string, string> = {}
    rows.forEach((r) => { out[r.key] = drafts[r.key] ?? r.value })
    return out
  }, [rows, drafts])

  const onFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const key = (e.target as HTMLElement).getAttribute?.('data-key')
    if (key) setFocusKey(key)
  }

  return (
    <div className="mx-auto w-full space-y-4 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Textos</h1>
          <p className="text-sm text-muted-foreground">Edite os textos exibidos no portfólio. Ctrl/Cmd+S para salvar.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="hidden lg:inline-flex"
          aria-pressed={showPreview}
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          Prévia
        </Button>
        <div className="flex rounded-lg border bg-muted/50 p-0.5 lg:hidden" role="group" aria-label="Modo">
          {([['edit', 'Editar'], ['preview', 'Prévia']] as const).map(([t, label]) => (
            <Button
              key={t}
              size="sm"
              variant={tab === t ? 'secondary' : 'ghost'}
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className={cn('grid items-start gap-6', showPreview ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]' : 'lg:grid-cols-1')}>
      <div
        onFocusCapture={onFocusCapture}
        className={cn('min-w-0 space-y-6', !showPreview && 'lg:mx-auto lg:w-full lg:max-w-3xl', tab === 'preview' && 'hidden lg:block')}
      >

      {loading ? (
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-64" /></CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum texto encontrado.</CardContent></Card>
      ) : (
        GROUPS.filter((g) => grouped[g.id].length).map((g) => {
          const Icon = g.icon
          const changed = grouped[g.id].filter((r) => dirtyKeys.includes(r.key)).length
          return (
            <Card key={g.id}>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle>{g.title}</CardTitle>
                    <CardDescription>{g.description}</CardDescription>
                  </div>
                  {changed > 0 && <Badge variant="secondary">{changed} {changed === 1 ? 'alteração' : 'alterações'}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {grouped[g.id].map((r) => (
                  <Field
                    key={r.key}
                    row={r}
                    value={drafts[r.key] ?? r.value}
                    dirty={dirtyKeys.includes(r.key)}
                    error={errors[r.key] ?? null}
                    onChange={(v) => setDraft(r.key, v)}
                    onRevert={() => revert(r.key)}
                  />
                ))}
              </CardContent>
            </Card>
          )
        })
      )}

      {dirtyCount > 0 && (
        <div className="sticky bottom-4 z-30 flex justify-center pointer-events-none">
          <div
            role="status"
            className="pointer-events-auto flex w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 shadow-lg"
          >
            <span className="text-sm font-medium">
              {dirtyCount} {dirtyCount === 1 ? 'alteração não salva' : 'alterações não salvas'}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={discardAll} disabled={saving}>
                <Undo className="size-4" /> Descartar
              </Button>
              <Button size="sm" onClick={() => void save()} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar alterações
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>

      {showPreview && (
        <div className={cn('lg:sticky lg:top-20 lg:block lg:h-[calc(100svh-6rem)]', tab === 'edit' ? 'hidden' : 'block h-[calc(100svh-14rem)]')}>
          <SitePreview content={previewContent} focusKey={focusKey} dirty={dirtyCount > 0} />
        </div>
      )}
      </div>
    </div>
  )
}
