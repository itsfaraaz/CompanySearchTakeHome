import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
}

/**
 * ChatInput - Message composition component.
 *
 * Provides:
 * - Expandable textarea for typing messages
 * - Submit button with loading state indicator
 * - Disabled state during message streaming
 *
 * Uses PromptInput primitives for consistent styling and behavior.
 */
export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = "Ask a follow-up question...",
}: ChatInputProps) {
  const handleSubmit = () => {
    if (!value.trim() || isLoading) return;
    onSubmit();
  };

  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <PromptInput
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-300 bg-white shadow-sm"
        >
          <PromptInputTextarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-12"
          />
          <PromptInputFooter>
            <div />
            <PromptInputSubmit
              disabled={isLoading || !value.trim()}
              status={isLoading ? "streaming" : undefined}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

