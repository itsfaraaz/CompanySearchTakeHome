import { useState, useCallback } from "react";

/**
 * Represents a single message in the chat conversation.
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseChatOptions {
  apiUrl?: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}

/**
 * useChat - Custom hook for managing chat state and streaming responses.
 *
 * Handles:
 * - Message history state
 * - Sending messages to the API
 * - Streaming response handling with real-time UI updates
 * - Loading and error states
 *
 * @param options.apiUrl - Optional custom API endpoint (defaults to localhost:8000)
 * @returns Chat state and control functions
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { apiUrl = "http://localhost:8000/api/chat" } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const apiMessages = [...messages, userMessage].map((m) => ({
          id: m.id,
          role: m.role,
          parts: [{ type: "text", text: m.content }],
        }));

        const response = await fetch(apiUrl, {
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
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantMessage.id)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, apiUrl]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}

