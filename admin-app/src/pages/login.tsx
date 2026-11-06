import { useState } from 'react'
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const css = `
@keyframes lg-float-a{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(6%,8%,0) scale(1.15)}}
@keyframes lg-float-b{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-8%,-6%,0) scale(1.2)}}
.lg-blob-a{animation:lg-float-a 18s ease-in-out infinite}
.lg-blob-b{animation:lg-float-b 22s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.lg-blob-a,.lg-blob-b{animation:none}}
`

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) {
      setError('E-mail ou senha incorretos.')
      return
    }
    setPassword('')
  }

  return (
    <main className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-background px-4 py-12">
      <style>{css}</style>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="lg-blob-a absolute -top-32 -left-24 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="lg-blob-b absolute -right-24 -bottom-32 size-[28rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="rounded-4xl bg-muted p-2 ring-1 ring-foreground/10">
          <div className="rounded-3xl bg-background px-6 py-8 shadow-[0_2px_4px_0_rgba(0,0,0,0.12)]">
            <div className="mb-6 space-y-3 text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-gradient-to-b from-primary to-primary/70 text-primary-foreground shadow-sm">
                <ShieldCheck className="size-5" aria-hidden />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Painel administrativo</h1>
                <p className="text-sm text-muted-foreground">Entre para gerenciar o conteúdo do seu portfólio.</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
              <div className="space-y-1.5">
                <Label htmlFor="login-email">E-mail</Label>
                <div className="relative">
                  <Mail aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 bg-muted pl-9"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Lock aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    name="password"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 bg-muted pr-10 pl-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={show}
                    className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <p role="alert" aria-live="polite" className="min-h-5 text-sm text-destructive">
                {error}
              </p>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-gradient-to-b from-primary to-primary/70 text-sm font-semibold dark:to-primary/60"
              >
                {loading && <Loader2 className="animate-spin" aria-hidden />}
                {loading ? 'Entrando…' : 'Entrar'}
              </Button>
            </form>
          </div>
          <p className="py-3 text-center text-xs text-muted-foreground">Acesso restrito ao administrador.</p>
        </div>
      </div>
    </main>
  )
}
