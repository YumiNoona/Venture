import { login } from '../auth-actions'
import { LoadingButton } from '@/components/ui/loading-button'
import Link from 'next/link'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

      <div className="w-full max-w-sm rounded-2xl border bg-card/80 backdrop-blur-sm p-8 shadow-lg relative" style={{ animation: 'scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-black">V</div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your account to continue</p>
        </div>

        {searchParams?.error && (
          <div className="mb-4 rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20" style={{ animation: 'pageEnter 0.3s ease-out forwards' }}>
            {searchParams.error}
          </div>
        )}

        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="w-full rounded-lg border bg-transparent px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-all duration-200 hover:border-muted-foreground/30"
              placeholder="you@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="w-full rounded-lg border bg-transparent px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-all duration-200 hover:border-muted-foreground/30"
              placeholder="••••••••"
            />
          </div>

          <LoadingButton formAction={login} className="w-full mt-2 h-11" loadingText="Signing in…">Sign in</LoadingButton>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
