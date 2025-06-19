import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import ChartRegistry from "./components/ChartRegistry";

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "Track and analyze your trading performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
        <ChartRegistry />
        
        {/* Modern Navigation Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg shadow-blue-500/5">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              
              {/* Logo/Brand */}
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-3 group">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300">
                    <span className="text-white font-bold text-lg lg:text-xl">TJ</span>
                  </div>
                  <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Trading Journal
                  </span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-1">
                <NavLink href="/" label="Dashboard" />
                <NavLink href="/trades" label="Trades" />
                <NavLink href="/analytics" label="Analytics" />
                <NavLink href="/heatmaps" label="Heatmaps" />
                <NavLink href="/risk-management" label="Risk Management" />
                <NavLink href="/trading-plan" label="Trading Plan" />
                <NavLink href="/calendar" label="Calendar" />
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <button
                  type="button"
                  className="mobile-menu-button p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/90 transition-all duration-300"
                  aria-label="Toggle mobile menu"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Navigation Menu */}
            <div className="mobile-menu hidden lg:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl mt-2 mb-4">
                <MobileNavLink href="/" label="Dashboard" />
                <MobileNavLink href="/trades" label="Trades" />
                <MobileNavLink href="/analytics" label="Analytics" />
                <MobileNavLink href="/heatmaps" label="Heatmaps" />
                <MobileNavLink href="/risk-management" label="Risk Management" />
                <MobileNavLink href="/trading-plan" label="Trading Plan" />
                <MobileNavLink href="/calendar" label="Calendar" />
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 lg:py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-5rem)]">
          {children}
        </main>

        {/* Mobile Menu Toggle Script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              const mobileMenuButton = document.querySelector('.mobile-menu-button');
              const mobileMenu = document.querySelector('.mobile-menu');
              
              if (mobileMenuButton && mobileMenu) {
                mobileMenuButton.addEventListener('click', function() {
                  mobileMenu.classList.toggle('hidden');
                });
                
                // Close menu when clicking outside
                document.addEventListener('click', function(event) {
                  if (!mobileMenuButton.contains(event.target) && !mobileMenu.contains(event.target)) {
                    mobileMenu.classList.add('hidden');
                  }
                });
              }
            });
          `
        }} />
      </body>
    </html>
  );
}

// Desktop Navigation Link Component
function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-xl text-gray-700 hover:text-indigo-600 font-medium transition-all duration-300 hover:bg-white/60 hover:backdrop-blur-sm hover:shadow-lg border border-transparent hover:border-white/30 relative group"
    >
      <span className="relative z-10">{label}</span>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </Link>
  );
}

// Mobile Navigation Link Component
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
