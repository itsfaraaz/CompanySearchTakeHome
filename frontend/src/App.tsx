import "./App.css";
import { useState } from "react";
import { useChat } from "@/hooks/useChat";
import { InitialView } from "@/components/InitialView";
import { ChatView } from "@/components/ChatView";

type ViewState = "initial" | "chat";

function App() {
  const [viewState, setViewState] = useState<ViewState>("initial");
  const { messages, isLoading, error, sendMessage, clearChat } = useChat();

  const handleInitialSubmit = (query: string) => {
    setViewState("chat");
    sendMessage(query);
  };

  const handleNewSearch = () => {
    setViewState("initial");
    clearChat();
  };

  if (viewState === "initial") {
    return <InitialView onSubmit={handleInitialSubmit} />;
  }

  return (
    <ChatView
      messages={messages}
      isLoading={isLoading}
      error={error}
      onSendMessage={sendMessage}
      onNewSearch={handleNewSearch}
    />
  );
}

export default App;
