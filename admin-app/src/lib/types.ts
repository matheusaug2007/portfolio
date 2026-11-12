export type SiteText = {
  key: string
  label: string
  value: string
  sort: number
}

export type Project = {
  id: string
  title: string
  description: string
  url: string
  image_url: string
  visible: boolean
  position: number
}

export type Section = {
  chave: string
  nome: string
  descricao: string
  visivel: boolean
  posicao: number
}

export type Skill = {
  id: string
  name: string
  visible: boolean
  position: number
}
