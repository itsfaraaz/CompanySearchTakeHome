import { useState, useEffect } from "react";
import { SearchIcon } from "lucide-react";

const exampleQueries = [
  "fintech startups in New York",
  "AI B2B SaaS in San Francisco",
  "martech and adtech startups",
];

interface InitialViewProps {
  onSubmit: (query: string) => void;
}

/**
 * InitialView - Landing page component for the Startup Directory.
 *
 * Displays:
 * - App title and description
 * - Search textarea with random placeholder example
 * - Quick-select buttons for common search queries
 *
 * Handles the initial search submission and transitions to chat view.
 */
export function InitialView({ onSubmit }: InitialViewProps) {
  const [placeholder, setPlaceholder] = useState<string>("");
  const [input, setInput] = useState<string>("");

  useEffect(() => {
    const randomQuery =
      exampleQueries[Math.floor(Math.random() * exampleQueries.length)];
    setPlaceholder(`e.g. ${randomQuery}`);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSubmit(input);
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F5F0] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-6">
        <div className="flex items-center gap-3 mb-2">
          <SearchIcon className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-semibold text-gray-800">
            Startup Directory
          </h1>
        </div>
        <p className="text-gray-600 text-center max-w-lg">
          Search our database of B2B SaaS startups. Ask specific queries or
          describe what you're looking for.
        </p>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative w-full">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className="w-full h-28 px-5 py-4 pr-16 rounded-2xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent shadow-sm text-base"
              placeholder={placeholder}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute bottom-4 right-4 px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors hover:bg-gray-700 disabled:hover:bg-gray-300"
              aria-label="Search"
            >
              Search
            </button>
          </div>
        </form>
        <div className="flex flex-wrap gap-2 justify-center">
          {exampleQueries.slice(0, 3).map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => setInput(query)}
              className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

