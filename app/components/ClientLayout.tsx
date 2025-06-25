'use client'

import Link from "next/link";
import UserMenu from "./UserMenu";
import MobileMenu from "./MobileMenu";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.includes('/signin') || pathname?.includes('/signup');

  return (
    <>
      {/* Modern Navigation Header - Hide on auth pages */}
      {!isAuthPage && <HeaderContent />}

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto ${!isAuthPage ? 'py-6 lg:py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-5rem)]' : ''}`}>
        {children}
      </main>
    </>
  );
}

// Header Content Component with Session Logic
function HeaderContent() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === 'authenticated';
  
  // Pages that clearly require authentication should show navigation
  const authenticatedPages = ['/trades', '/analytics', '/ai-insights', '/heatmaps', '/risk-management', '/trading-plan', '/calendar'];
  const isOnAuthenticatedPage = authenticatedPages.some(page => pathname?.startsWith(page));
  
  // Show navigation if authenticated OR if on a page that requires authentication
  const shouldShowNavigation = isAuthenticated || status === 'loading' || isOnAuthenticatedPage;

  // Debug logging
  console.log('HeaderContent - Session status:', status);
  console.log('HeaderContent - Session data:', session);
  console.log('HeaderContent - Is authenticated:', isAuthenticated);
  console.log('HeaderContent - Current pathname:', pathname);
  console.log('HeaderContent - Is on authenticated page:', isOnAuthenticatedPage);
  console.log('HeaderContent - Should show navigation:', shouldShowNavigation);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/30 shadow-lg shadow-blue-500/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* Logo/Brand */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg lg:text-xl">TJ</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Trading Journal
                </span>
                <div className="text-xs text-gray-500 font-medium -mt-1">
                  Professional Trading Platform
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          {shouldShowNavigation && (
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-3xl mx-8">
              <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm rounded-2xl p-1 border border-white/40 shadow-inner">
                <NavLink href="/" label="Dashboard" />
                <NavLink href="/trades" label="Trades" />
                <NavLink href="/analytics" label="Analytics" />
                <NavLink href="/ai-insights" label="AI Insights" />
                <NavLink href="/heatmaps" label="Heatmaps" />
                <NavLink href="/risk-management" label="Risk" />
                <NavLink href="/trading-plan" label="Plan" />
                <NavLink href="/calendar" label="Calendar" />
              </div>
            </div>
          )}

          {/* User Menu - Right */}
          <div className="flex items-center flex-shrink-0">
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          {shouldShowNavigation && (
            <div className="lg:hidden">
              <button
                type="button"
                className="mobile-menu-button p-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/40 shadow-lg hover:shadow-xl hover:bg-white/90 transition-all duration-300"
                aria-label="Toggle mobile menu"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {shouldShowNavigation && <MobileMenu />}
      </nav>
    </header>
  );
}

// Enhanced Navigation Link Component
function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));
  
  return (
    <Link
      href={href}
      className={`
        px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative group
        ${isActive 
          ? 'text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/30' 
          : 'text-gray-700 hover:text-indigo-600 hover:bg-white/80 hover:shadow-md'
        }
      `}
    >
      <span className="relative z-10">{label}</span>
      {!isActive && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}
    </Link>
  );
} 