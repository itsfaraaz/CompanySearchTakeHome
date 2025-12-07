import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { ChatArea } from "./ChatArea";
import { ChatInput } from "./ChatInput";
import type { ChatMessage } from "@/hooks/useChat";

interface ChatViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (text: string) => void;
  onNewSearch: () => void;
}

/**
 * ChatView - Main chat interface container component.
 *
 * Orchestrates the chat experience by combining:
 * - Header with navigation back to initial search
 * - ChatArea for displaying message history
 * - ChatInput for user message composition
 *
 * Manages local input state and delegates message sending to parent.
 */

export function ChatView({
  messages,
  isLoading,
  error,
  onSendMessage,
  onNewSearch,
}: ChatViewProps) {
  const [input, setInput] = useState<string>("");

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="h-screen w-full bg-[#F5F5F0] flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <SearchIcon className="w-5 h-5 text-gray-600" />
          <h1 className="text-lg font-medium text-gray-800">
            Startup Directory
          </h1>
          <button
            type="button"
            onClick={onNewSearch}
            className="ml-auto text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            New Search
          </button>
        </div>
      </header>

      {/* Chat area */}
      <ChatArea messages={messages} isLoading={isLoading} error={error} />

      {/* Input area */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}

