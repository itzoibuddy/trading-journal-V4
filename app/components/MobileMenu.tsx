'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function MobileMenu() {
  const { data: session, status } = useSession()

  // Always show mobile menu when this component is rendered
  // since the parent HeaderContent already checks authentication
  return (
    <div className="mobile-menu hidden lg:hidden">
      <div className="px-2 pt-2 pb-3 space-y-1 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl mt-2 mb-4">
        <MobileNavLink href="/" label="Dashboard" />
        <MobileNavLink href="/trades" label="Trades" />
        <MobileNavLink href="/analytics" label="Analytics" />
        <MobileNavLink href="/evolution" label="Evolution Tracker" />
        <MobileNavLink href="/heatmaps" label="Heatmaps" />
        <MobileNavLink href="/risk-management" label="Risk Management" />
        <MobileNavLink href="/trading-plan" label="Trading Plan" />
        <MobileNavLink href="/calendar" label="Calendar" />
      </div>
    </div>
  )
}

function MobileNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-4 py-3 rounded-xl text-gray-700 hover:text-indigo-600 font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 border border-transparent hover:border-indigo-200 hover:shadow-md"
    >
      {label}
    </Link>
  );
} 