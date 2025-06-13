export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gray-50">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Trading Journal
        </h1>
        <p className="mt-3 text-lg text-gray-600 sm:text-xl md:max-w-3xl">
          Track your trades, analyze your performance, and improve your results.
        </p>
        
        <div className="mt-10">
          <a
            href="/landing"
            className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
          >
            Get Started
          </a>
        </div>
      </main>
    </div>
  );
}
