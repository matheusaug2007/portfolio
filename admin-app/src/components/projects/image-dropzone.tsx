import { useRef, useState } from 'react'
import { ImagePlus, RefreshCw, Trash2, UploadCloud } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { resolveImage } from './project-utils'

type Props = {
  value: string
  uploading: boolean
  progress: number
  onFile: (file: File) => void
  onRemove: () => void
}

export function ImageDropzone({ value, uploading, progress, onFile, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const img = resolveImage(value)

  const pick = () => !uploading && inputRef.current?.click()

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) onFile(f)
        }}
      />
      <div
        role="button"
        tabIndex={0}
        aria-label="Enviar imagem: arraste um arquivo ou pressione Enter para escolher"
        aria-busy={uploading}
        onClick={pick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            pick()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f && !uploading) onFile(f)
        }}
        className={cn(
          'relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-input bg-muted/30 text-center outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50',
          over && 'border-primary bg-primary/10',
          uploading && 'cursor-progress',
        )}
      >
        {img && (
          <img
            src={img}
            alt="Prévia da imagem do projeto"
            className={cn('absolute inset-0 size-full object-cover', uploading && 'opacity-30')}
          />
        )}
        {uploading ? (
          <div className="relative z-10 w-2/3 space-y-2">
            <p className="text-sm font-medium">Enviando imagem…</p>
            <Progress value={progress} />
          </div>
        ) : !img ? (
          <div className="flex flex-col items-center gap-2 px-4 text-muted-foreground">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              {over ? <UploadCloud className="size-5" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
            </span>
            <p className="text-sm">
              <span className="font-medium text-foreground">Clique para enviar</span> ou arraste aqui
            </p>
            <p className="text-xs">JPG, PNG ou WebP · até 2 MB</p>
          </div>
        ) : over ? (
          <div className="relative z-10 rounded-md bg-background/90 px-3 py-1.5 text-sm font-medium">
            Solte para substituir
          </div>
        ) : null}
      </div>
      {img && !uploading && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={pick}>
            <RefreshCw aria-hidden /> Substituir
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 aria-hidden /> Remover
          </Button>
        </div>
      )}
    </div>
  )
}
