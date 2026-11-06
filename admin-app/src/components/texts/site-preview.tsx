import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, Monitor, RotateCw, Smartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Device = 'desktop' | 'mobile'

const WIDTHS: Record<Device, number> = { desktop: 1280, mobile: 390 }

export function SitePreview({
  content,
  focusKey,
  dirty = true,
  className,
}: {
  content: Record<string, string>
  focusKey?: string | null
  dirty?: boolean
  className?: string
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const [device, setDevice] = useState<Device>('desktop')
  const [ready, setReady] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [size, setSize] = useState({ w: 0, h: 0 })

  const contentRef = useRef(content)
  contentRef.current = content
  const focusRef = useRef(focusKey)
  focusRef.current = focusKey
  const readyRef = useRef(false)
  readyRef.current = ready

  const post = useCallback((msg: unknown) => {
    iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin)
  }, [])

  // Track container size.
  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Listen for the site's ready signal.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (e.source !== iframeRef.current?.contentWindow) return
      if ((e.data as { type?: string } | null)?.type !== 'preview-ready') return
      setReady(true)
      readyRef.current = true
      post({ type: 'preview-content', content: contentRef.current })
      if (focusRef.current) post({ type: 'preview-focus', key: focusRef.current })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [post])

  // Debounced content sync.
  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(() => post({ type: 'preview-content', content }), 150)
    return () => window.clearTimeout(t)
  }, [content, ready, post])

  // Focus sync.
  useEffect(() => {
    if (ready && focusKey) post({ type: 'preview-focus', key: focusKey })
  }, [focusKey, ready, post])

  const reload = () => {
    setReady(false)
    setReloadKey((k) => k + 1)
  }

  const vw = WIDTHS[device]
  const pad = device === 'mobile' ? 24 : 0
  const scale = size.w > 0 ? Math.min(1, (size.w - pad * 2) / vw) : 1
  const vh = size.h > 0 ? (size.h - pad * 2) / scale : 800
  const frameW = vw * scale
  const frameH = vh * scale

  return (
    <div className={cn('flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm', className)}>
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-3 py-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-muted-foreground/40" />
          <span className="size-2.5 rounded-full bg-primary/60" />
        </div>
        <div className="mx-1 min-w-0 flex-1 truncate rounded-full border bg-background px-3 py-1 text-center text-xs text-muted-foreground">
          matheuscode.dev.br
        </div>
        <div className="flex items-center rounded-lg border bg-background p-0.5" role="group" aria-label="Dispositivo">
          {([['desktop', Monitor, 'Desktop'], ['mobile', Smartphone, 'Mobile']] as const).map(([d, Icon, label]) => (
            <Button
              key={d}
              type="button"
              size="icon-xs"
              variant={device === d ? 'secondary' : 'ghost'}
              aria-pressed={device === d}
              aria-label={label}
              title={label}
              onClick={() => setDevice(d)}
            >
              <Icon className="size-3.5" />
            </Button>
          ))}
        </div>
        <Button type="button" size="icon-xs" variant="ghost" aria-label="Recarregar prévia" title="Recarregar" onClick={reload}>
          <RotateCw className="size-3.5" />
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Abrir site em nova aba"
          title="Abrir site"
          render={<a href="/" target="_blank" rel="noopener noreferrer" />}
        >
          <ExternalLink className="size-3.5" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
        <Badge variant={dirty ? 'secondary' : 'outline'} className="text-[10px]">
          <span className={cn('mr-1 inline-block size-1.5 rounded-full', dirty ? 'bg-primary animate-pulse' : 'bg-muted-foreground/50')} />
          {dirty ? 'Prévia ao vivo — não salvo' : 'Sem alterações'}
        </Badge>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {device === 'desktop' ? 'Desktop' : 'Mobile'} · {vw}px
        </span>
      </div>

      <div ref={areaRef} className="relative min-h-0 flex-1 overflow-hidden bg-muted/30">
        <div
          className={cn(
            'absolute left-1/2 -translate-x-1/2 overflow-hidden bg-background',
            device === 'mobile' ? 'top-6 rounded-[2rem] border-4 border-foreground/80 shadow-xl' : 'top-0',
          )}
          style={{ width: frameW, height: frameH }}
        >
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src="/"
            title="Prévia do site"
            className="block origin-top-left border-0 bg-background"
            style={{ width: vw, height: vh, transform: `scale(${scale})` }}
          />
        </div>

        {!ready && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm" role="status">
            <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="text-xs text-muted-foreground">Carregando prévia…</p>
          </div>
        )}
      </div>
    </div>
  )
}
