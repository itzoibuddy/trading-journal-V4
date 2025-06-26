'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileMenu() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Always show mobile menu when this component is rendered
  // since the parent HeaderContent already checks authentication
  return (
    <div className="mobile-menu hidden lg:hidden">
      <div className="px-2 pt-2 pb-3 space-y-1 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl mt-2 mb-4">
        <MobileNavLink href="/" label="Dashboard" isActive={pathname === '/'} />
        <MobileNavLink href="/trades" label="Trades" isActive={pathname?.startsWith('/trades')} />
        <MobileNavLink href="/analytics" label="Analytics" isActive={pathname?.startsWith('/analytics')} />
        <MobileNavLink href="/evolution" label="Evolution Tracker" isActive={pathname?.startsWith('/evolution')} />
        <MobileNavLink href="/ai-insights" label="AI Insights" isActive={pathname?.startsWith('/ai-insights')} />
        <MobileNavLink href="/heatmaps" label="Heatmaps" isActive={pathname?.startsWith('/heatmaps')} />
        <MobileNavLink href="/risk-management" label="Risk Management" isActive={pathname?.startsWith('/risk-management')} />
        <MobileNavLink href="/trading-plan" label="Trading Plan" isActive={pathname?.startsWith('/trading-plan')} />
        <MobileNavLink href="/calendar" label="Calendar" isActive={pathname?.startsWith('/calendar')} />
      </div>
    </div>
  )
}

function MobileNavLink({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`block px-4 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
        isActive
          ? 'text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg'
          : 'text-gray-700 hover:text-indigo-600 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 border border-transparent hover:border-indigo-200 hover:shadow-md'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </Link>
  );
} 