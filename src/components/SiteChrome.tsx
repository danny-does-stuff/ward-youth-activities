import { Link } from '@tanstack/react-router'

export function SiteChrome({
  children,
  wardName,
  current,
}: {
  children: React.ReactNode
  wardName: string
  current: 'home' | 'submit' | 'admin'
}) {
  return (
    <div className="shell">
      <header className="magnet-bar px-4 py-3">
        <p className="font-display text-xl leading-tight tracking-wide sm:text-2xl">
          {wardName} Youth Activities
        </p>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-28 pt-6 sm:mx-0 sm:max-w-lg sm:px-6">
        {children}
      </main>
      {current !== 'admin' && (
        <nav className="thumb-nav" aria-label="Main">
          <Link to="/" data-active={current === 'home' ? 'true' : 'false'}>
            Schedule
          </Link>
          <Link
            to="/submit"
            data-active={current === 'submit' ? 'true' : 'false'}
          >
            Add event
          </Link>
        </nav>
      )}
    </div>
  )
}
