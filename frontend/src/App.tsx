import "./App.css";
import { useState, useEffect, useCallback } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { SearchIcon } from "lucide-react";

const exampleQueries = [
  "fintech startups in New York",
  "AI B2B SaaS in San Francisco",
  "martech and adtech startups"
];

type ViewState = "initial" | "chat";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function App() {
  const [viewState, setViewState] = useState<ViewState>("initial");
  const [placeholder, setPlaceholder] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null | undefined>(null);

  useEffect(() => {
    const randomQuery =
      exampleQueries[Math.floor(Math.random() * exampleQueries.length)];
    setPlaceholder(`e.g. ${randomQuery}`);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    // create an assistant message with an empty content
    // this will be updated with the streamed content
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Build messages for API (include history)
      const apiMessages = [...messages, userMessage].map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text", text: m.content }],
      }));

      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        // Update the assistant message with streamed content
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: accumulatedContent }
              : m
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setViewState("chat");
    sendMessage(input);
    setInput("");
  };

  const handleChatSubmit = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const handleNewSearch = () => {
    setViewState("initial");
    setInput("");
    setMessages([]);
    setError(null);
  };

  // Initial landing view
  if (viewState === "initial") {
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
          <form onSubmit={handleInitialSubmit} className="w-full">
            <div className="relative w-full">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                    e.preventDefault();
                    handleInitialSubmit(e);
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

  // Chat view
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
            onClick={handleNewSearch}
            className="ml-auto text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            New Search
          </button>
        </div>
      </header>

      {/* Chat area */}
      <Conversation className="flex-1 overflow-hidden">
        <ConversationContent className="max-w-4xl mx-auto w-full px-4 py-6">
          {messages.map((message) => (
            <div key={message.id}>
              <Message from={message.role}>
                <MessageContent
                  className={message.role === "user" ? "!bg-gray-900 !text-white" : ""}
                >
                  {message.role === "user" ? (
                    <span>{message.content}</span>
                  ) : (
                    <MessageResponse className="prose-message">{message.content}</MessageResponse>
                  )}
                </MessageContent>
              </Message>
            </div>
          ))}

          {/* Loading state - show when streaming and last message is empty */}
          {isLoading && messages.length > 0 && !messages[messages.length - 1]?.content && (
            <Message from="assistant">
              <MessageContent>
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span>Thinking...</span>
                </div>
              </MessageContent>
            </Message>
          )}

          {/* Error state */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
              <p>Error: {error}</p>
              <p className="text-sm mt-1">Please try again.</p>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <PromptInput
            onSubmit={handleChatSubmit}
            className="rounded-xl border border-gray-300 bg-white shadow-sm"
          >
            <PromptInputTextarea
              placeholder="Ask a follow-up question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-12"
            />
            <PromptInputFooter>
              <div />
              <PromptInputSubmit
                disabled={isLoading || !input.trim()}
                status={isLoading ? "streaming" : undefined}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}

export default App;
