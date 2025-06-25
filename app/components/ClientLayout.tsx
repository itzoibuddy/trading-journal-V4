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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-gray-200/50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo/Brand - Enhanced */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <span className="text-white font-bold text-base">TJ</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-gray-900">Trading Journal</span>
                <div className="text-xs text-gray-500 font-medium -mt-0.5">Professional Platform</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Simplified & Grouped */}
          {shouldShowNavigation && (
            <div className="hidden lg:flex items-center space-x-8">
              
              {/* Core Trading Group */}
              <div className="flex items-center space-x-1">
                <NavLink href="/" label="Dashboard" icon="🏠" />
                <NavLink href="/trades" label="Trades" icon="📊" />
                <NavLink href="/analytics" label="Analytics" icon="📈" />
              </div>

              {/* AI & Intelligence Group */}
              <div className="flex items-center space-x-1 border-l border-gray-200 pl-6">
                <NavLink href="/ai-insights" label="AI Insights" icon="🧠" priority />
              </div>

              {/* Tools Group */}
              <div className="flex items-center space-x-1 border-l border-gray-200 pl-6">
                <DropdownMenu 
                  label="Tools" 
                  icon="🛠️"
                  items={[
                    { href: '/heatmaps', label: 'Heatmaps', icon: '🔥' },
                    { href: '/calendar', label: 'Calendar', icon: '📅' },
                    { href: '/risk-management', label: 'Risk Management', icon: '⚠️' },
                    { href: '/trading-plan', label: 'Trading Plan', icon: '📋' }
                  ]}
                />
              </div>
            </div>
          )}

          {/* User Menu - Right */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Quick Actions */}
            {shouldShowNavigation && (
              <div className="hidden md:flex items-center space-x-2">
                <Link 
                  href="/trades" 
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                >
                  + Add Trade
                </Link>
              </div>
            )}
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          {shouldShowNavigation && (
            <div className="lg:hidden">
              <button
                type="button"
                className="mobile-menu-button p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                aria-label="Toggle mobile menu"
              >
                <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
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
function NavLink({ href, label, icon, priority = false }: { href: string; label: string; icon?: string; priority?: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));
  
  return (
    <Link
      href={href}
      className={`
        group flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative
        ${isActive 
          ? priority 
            ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-md' 
            : 'text-blue-700 bg-blue-50 border border-blue-200'
          : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
        }
      `}
    >
      {icon && <span className="text-sm">{icon}</span>}
      <span>{label}</span>
      {priority && !isActive && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      )}
    </Link>
  );
}

// Dropdown Menu Component for Tools
function DropdownMenu({ label, icon, items }: { label: string; icon?: string; items: Array<{href: string; label: string; icon: string}> }) {
  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50 transition-all duration-200">
        {icon && <span className="text-sm">{icon}</span>}
        <span>{label}</span>
        <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown Menu */}
      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-2">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-150"
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 