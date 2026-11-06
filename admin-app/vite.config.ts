import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import sirv from 'sirv'
import { defineConfig, type Plugin } from 'vite'

// Só no `npm run dev`: serve o site público (pasta pai) em `/`, para a prévia do painel
// funcionar localmente com o mesmo origin. Não entra no build.
function serveSite(): Plugin {
  const allowed = ['/', '/index.html', '/assets/', '/imagens/', '/robots.txt']
  return {
    name: 'serve-site-for-preview',
    apply: 'serve',
    configureServer(server) {
      const handler = sirv(path.resolve(__dirname, '..'), { dev: true })
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]
        if (allowed.some((p) => (p.endsWith('/') && p !== '/' ? url.startsWith(p) : url === p))) {
          return handler(req, res, next)
        }
        next()
      })
    },
  }
}

// O app é servido em /admin/ (mesma origem do site). O build vai direto para ../admin.
export default defineConfig({
  base: '/admin/',
  plugins: [react(), tailwindcss(), serveSite()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: '../admin',
    emptyOutDir: true,
  },
})
