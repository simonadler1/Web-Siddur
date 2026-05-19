import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { MenuIcon } from 'lucide-react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { t } from '@/lib/ui'
import { useSettings } from '@/lib/settings'
import { loadLocation, isInIsrael } from '@/lib/location'
import { relevantPrayers } from '@/lib/relevantPrayers'
import { getGenerator } from '@/generators/registry'

const STATIC_LINKS: Array<{ to: string; key: string }> = [
  { to: '/', key: 'home' },
  { to: '/zmanim', key: 'zmanim' },
  { to: '/prayers', key: 'prayers' },
  { to: '/locations', key: 'locations_tab' },
  { to: '/compass', key: 'compass' },
  { to: '/settings', key: 'settings' },
]

export function AppHeader() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { settings } = useSettings()

  // Close the drawer on route change.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const location = useMemo(() => loadLocation(), [])
  const relevant = useMemo(
    () => relevantPrayers(location, settings.inIsrael || isInIsrael(location), new Date()),
    // Recompute when settings/location change. The drawer also re-renders when
    // it opens, which gives a fresh `now` reading at the moment of interaction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location, settings.inIsrael, open],
  )

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between px-3 h-14 max-w-3xl mx-auto">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              data-testid="menu-button"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[85vw] max-w-sm flex flex-col"
            data-testid="nav"
          >
            <SheetHeader>
              <SheetTitle>{t('app_name')}</SheetTitle>
              <SheetDescription>
                {relevant.isTransition ? t('today') : ''}
              </SheetDescription>
            </SheetHeader>

            <nav className="flex-1 overflow-y-auto px-2 pb-6 flex flex-col gap-1">
              <SectionLabel>{t('today')}</SectionLabel>
              <ul className="flex flex-col gap-1">
                {relevant.ids.map((id) => {
                  const gen = getGenerator(id)
                  if (!gen) return null
                  return (
                    <li key={id}>
                      <DrawerLink to={`/prayer/${id}`}>{t(gen.titleKey)}</DrawerLink>
                    </li>
                  )
                })}
              </ul>

              <Separator className="my-3" />

              <ul className="flex flex-col gap-1">
                {STATIC_LINKS.map((link) => (
                  <li key={link.to}>
                    <DrawerLink to={link.to}>{t(link.key)}</DrawerLink>
                  </li>
                ))}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="text-base font-medium" aria-label={t('app_name')}>
          {t('app_name')}
        </Link>

        {relevant.isTransition ? (
          <Badge variant="secondary" className="text-xs" aria-label="day transition">
            ✦
          </Badge>
        ) : (
          <span className="size-9" aria-hidden />
        )}
      </div>
    </header>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  )
}

function DrawerLink({
  to,
  children,
}: {
  to: string
  children: React.ReactNode
}) {
  return (
    <SheetClose asChild>
      <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          cn(
            'block px-3 py-3 rounded-md text-sm transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            isActive && 'bg-accent text-accent-foreground font-medium',
          )
        }
      >
        {children}
      </NavLink>
    </SheetClose>
  )
}
