import { useEffect, useState } from 'react'

export const ROUTES = ['home', 'texts', 'sections', 'projects', 'skills'] as const
export type Route = (typeof ROUTES)[number]

const read = (): Route => {
  const h = window.location.hash.replace(/^#\/?/, '') as Route
  return ROUTES.includes(h) ? h : 'home'
}

/** Roteamento por hash (#/projects): funciona em hospedagem estática sem rewrites. */
export function useRoute() {
  const [route, setRoute] = useState<Route>(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const go = (r: Route) => {
    window.location.hash = '/' + r
  }
  return [route, go] as const
}
