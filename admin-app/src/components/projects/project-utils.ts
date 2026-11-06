export type ProjectDraft = {
  title: string
  description: string
  url: string
  image_url: string
  visible: boolean
}

export const LIMITS = { title: 80, description: 600, url: 500, image: 500 }

/** Legacy relative paths (imagens/...) live at the site root. */
export function resolveImage(value: string): string {
  const v = value.trim()
  if (!v) return ''
  return v.startsWith('imagens/') ? '/' + v : v
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//i, '')
  }
}

/** Returns an error message (pt-BR) or null when valid. */
export function validateDraft(d: ProjectDraft): string | null {
  if (!d.title.trim()) return 'Dê um nome ao projeto.'
  if (d.title.trim().length > LIMITS.title) return `O nome pode ter no máximo ${LIMITS.title} caracteres.`
  if (d.description.trim().length > LIMITS.description)
    return `A descrição pode ter no máximo ${LIMITS.description} caracteres.`
  if (!/^https:\/\//i.test(d.url.trim())) return 'O link do projeto precisa começar com https://'
  if (d.url.trim().length > LIMITS.url) return `O link pode ter no máximo ${LIMITS.url} caracteres.`
  if (d.image_url.trim().length > LIMITS.image) return `O link da imagem pode ter no máximo ${LIMITS.image} caracteres.`
  return null
}
