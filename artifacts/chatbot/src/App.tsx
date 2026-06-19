import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { useChat } from "@/hooks/useChat";
import { useTheme } from "@/hooks/useTheme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function ChatApp() {
  const { theme, toggle } = useTheme();
  const {
    conversations,
    convLoading,
    activeConvId,
    messages,
    isLoading,
    loadConversation,
    startNewChat,
    deleteConversation,
    sendMessage,
    clearMessages,
    stopStreaming,
  } = useChat();

  return (
    <div className="flex h-full bg-background text-foreground overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onSelect={loadConversation}
        onNew={startNewChat}
        onDelete={deleteConversation}
        theme={theme}
        onToggleTheme={toggle}
        isLoading={isLoading}
      />
      <main className="flex-1 flex flex-col min-w-0 h-full">
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          activeConvId={activeConvId}
          onSend={sendMessage}
          onStop={stopStreaming}
          onClear={clearMessages}
        />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <ChatApp />
      </WouterRouter>
    </QueryClientProvider>
  );
}
