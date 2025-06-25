'use client'

import Link from "next/link";
import UserMenu from "./UserMenu";
import MobileMenu from "./MobileMenu";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.includes('/signin') || pathname?.includes('/signup');

  return (
    <>
      {/* Premium Navigation Header */}
      {!isAuthPage && <PremiumHeaderContent />}

      {/* Main Content */}
      <main className={`${!isAuthPage ? 'pt-20 min-h-screen' : ''}`}>
        <div className={`max-w-7xl mx-auto ${!isAuthPage ? 'py-8 px-4 sm:px-6 lg:px-8' : ''}`}>
          {children}
        </div>
      </main>
    </>
  );
}

function PremiumHeaderContent() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = status === 'authenticated';
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const authenticatedPages = ['/trades', '/analytics', '/ai-insights', '/heatmaps', '/risk-management', '/trading-plan', '/calendar'];
  const isOnAuthenticatedPage = authenticatedPages.some(page => pathname?.startsWith(page));
  const shouldShowNavigation = isAuthenticated || status === 'loading' || isOnAuthenticatedPage;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-xl shadow-black/5 border-b border-gray-200/50' 
        : 'bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200/30'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          
          {/* Premium Logo & Brand */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
                  <span className="relative text-white font-bold text-lg">TJ</span>
                </div>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </div>
              <div className="hidden sm:block">
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                    Trading Journal
                  </span>
                  <span className="text-xs font-medium text-gray-500 -mt-0.5">
                    Professional Platform
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Premium Desktop Navigation */}
          {shouldShowNavigation && (
            <div className="hidden lg:flex items-center space-x-8">
              
              {/* Core Trading Section */}
              <div className="flex items-center space-x-1">
                <PremiumNavLink 
                  href="/" 
                  label="Dashboard" 
                  icon={<DashboardIcon />}
                />
                <PremiumNavLink 
                  href="/trades" 
                  label="Trades" 
                  icon={<TradesIcon />}
                />
                <PremiumNavLink 
                  href="/analytics" 
                  label="Analytics" 
                  icon={<AnalyticsIcon />}
                />
              </div>

              {/* AI Intelligence Section */}
              <div className="flex items-center space-x-1 relative">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-px h-6 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                <div className="pl-6">
                  <PremiumNavLink 
                    href="/ai-insights" 
                    label="AI Insights" 
                    icon={<AIIcon />}
                    premium
                  />
                </div>
              </div>

              {/* Tools Section */}
              <div className="flex items-center space-x-1 relative">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-px h-6 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                <div className="pl-6">
                  <PremiumDropdown />
                </div>
              </div>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            {shouldShowNavigation && (
              <div className="hidden md:flex items-center space-x-3">
                <Link 
                  href="/trades" 
                  className="group relative px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Trade</span>
                  </span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </Link>
                
                {/* Market Status Indicator */}
                <div className="hidden xl:flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700">Markets Open</span>
                </div>
              </div>
            )}
            
            <UserMenu />

            {/* Mobile Menu Button */}
            {shouldShowNavigation && (
              <div className="lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="mobile-menu-button p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 relative group"
                  aria-label="Toggle mobile menu"
                >
                  <div className="w-6 h-6 flex flex-col justify-center items-center">
                    <span className={`block w-5 h-0.5 bg-current transition-all duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
                    <span className={`block w-5 h-0.5 bg-current mt-1 transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`block w-5 h-0.5 bg-current mt-1 transition-all duration-200 ${mobileMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {shouldShowNavigation && <EnhancedMobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />}
      </nav>
    </header>
  );
}

function PremiumNavLink({ href, label, icon, premium = false }: { 
  href: string; 
  label: string; 
  icon: React.ReactNode; 
  premium?: boolean 
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));
  
  return (
    <Link
      href={href}
      className={`group relative flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
        isActive 
          ? premium
            ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/25'
            : 'text-blue-700 bg-blue-50 border border-blue-200 shadow-sm'
          : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
      }`}
    >
      <span className={`transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span>{label}</span>
      
      {/* Premium glow effect */}
      {premium && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      )}
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full"></div>
      )}
    </Link>
  );
}

function PremiumDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  
  const toolsItems = [
    { href: '/heatmaps', label: 'Heatmaps', icon: <HeatmapIcon />, description: 'Visual performance analysis' },
    { href: '/calendar', label: 'Calendar', icon: <CalendarIcon />, description: 'Economic events & earnings' },
    { href: '/risk-management', label: 'Risk Management', icon: <RiskIcon />, description: 'Portfolio risk analysis' },
    { href: '/trading-plan', label: 'Trading Plan', icon: <PlanIcon />, description: 'Strategy & rules management' }
  ];

  return (
    <div className="relative" onMouseLeave={() => setIsOpen(false)}>
      <button 
        onMouseEnter={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:text-blue-700 hover:bg-gray-50 transition-all duration-200 group"
      >
        <ToolsIcon />
        <span>Tools</span>
        <svg className={`w-4 h-4 text-gray-400 transition-all duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'group-hover:text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Premium Dropdown Menu */}
      <div className={`absolute top-full left-0 mt-2 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 transition-all duration-200 ${
        isOpen ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
      }`} onMouseEnter={() => setIsOpen(true)}>
        <div className="p-2">
          {toolsItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex items-start space-x-3 p-3 rounded-xl text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-all duration-150 group"
              onClick={() => setIsOpen(false)}
            >
              <span className="mt-0.5 transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-sm">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function EnhancedMobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <div className={`lg:hidden transition-all duration-300 overflow-hidden ${
      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
    }`}>
      <div className="px-4 py-4 bg-white/95 backdrop-blur-md border-t border-gray-200/50">
        <div className="space-y-1">
          <MobileNavItem href="/" label="Dashboard" icon={<DashboardIcon />} onClose={onClose} />
          <MobileNavItem href="/trades" label="Trades" icon={<TradesIcon />} onClose={onClose} />
          <MobileNavItem href="/analytics" label="Analytics" icon={<AnalyticsIcon />} onClose={onClose} />
          <MobileNavItem href="/ai-insights" label="AI Insights" icon={<AIIcon />} onClose={onClose} premium />
          <MobileNavItem href="/heatmaps" label="Heatmaps" icon={<HeatmapIcon />} onClose={onClose} />
          <MobileNavItem href="/calendar" label="Calendar" icon={<CalendarIcon />} onClose={onClose} />
          <MobileNavItem href="/risk-management" label="Risk Management" icon={<RiskIcon />} onClose={onClose} />
          <MobileNavItem href="/trading-plan" label="Trading Plan" icon={<PlanIcon />} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

function MobileNavItem({ href, label, icon, onClose, premium = false }: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClose: () => void;
  premium?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
        isActive
          ? premium
            ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600'
            : 'text-blue-700 bg-blue-50 border border-blue-200'
          : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

// Icon Components
function DashboardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0H8z" />
    </svg>
  );
}

function TradesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function AIIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function HeatmapIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function RiskIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
} 