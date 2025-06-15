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
      <body>
        <ChartRegistry />
        <header className="bg-white shadow sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-indigo-600 tracking-tight">Trading Journal</span>
            </div>
            <div className="flex gap-6">
              <Link href="/" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Dashboard</Link>
              <Link href="/trades" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Trades</Link>
              <Link href="/analytics" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Analytics</Link>
              <Link href="/heatmaps" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Heatmaps</Link>
              <Link href="/risk-management" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Risk Management</Link>
              <Link href="/trading-plan" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Trading Plan</Link>
              <Link href="/calendar" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Calendar</Link>
            </div>
          </nav>
        </header>
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </body>
    </html>
  );
}
