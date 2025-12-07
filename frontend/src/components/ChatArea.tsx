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
import type { ChatMessage } from "@/hooks/useChat";

interface ChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

/**
 * ChatArea - Scrollable message display component.
 *
 * Renders:
 * - User messages (styled with dark background)
 * - Assistant responses (with markdown-like formatting)
 * - Loading indicator during streaming
 * - Error messages when requests fail
 *
 * Uses Conversation primitives for scroll behavior and auto-scroll button.
 */
export function ChatArea({ messages, isLoading, error }: ChatAreaProps) {
  const lastMessage = messages[messages.length - 1];
  const showLoadingIndicator =
    isLoading && messages.length > 0 && !lastMessage?.content;

  return (
    <Conversation className="flex-1 overflow-hidden">
      <ConversationContent className="max-w-4xl mx-auto w-full px-4 py-6">
        {messages.map((message) => (
          <div key={message.id}>
            <Message from={message.role}>
              <MessageContent
                className={
                  message.role === "user" ? "!bg-gray-900 !text-white" : ""
                }
              >
                {message.role === "user" ? (
                  <span>{message.content}</span>
                ) : (
                  <MessageResponse className="prose-message">
                    {message.content}
                  </MessageResponse>
                )}
              </MessageContent>
            </Message>
          </div>
        ))}

        {showLoadingIndicator && (
          <Message from="assistant">
            <MessageContent>
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span>Thinking...</span>
              </div>
            </MessageContent>
          </Message>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
            <p>Error: {error}</p>
            <p className="text-sm mt-1">Please try again.</p>
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

