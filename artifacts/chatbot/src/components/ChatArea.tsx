import { useEffect, useRef, useCallback } from "react";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import type { LocalMessage } from "@/hooks/useChat";
import { Bot, Sparkles, Zap, BookOpen, Code2, Download } from "lucide-react";

const SUGGESTIONS = [
  { icon: Sparkles, text: "What is artificial intelligence?" },
  { icon: Zap, text: "Explain machine learning in simple terms" },
  { icon: BookOpen, text: "What is this CodeAlpha chatbot project?" },
  { icon: Code2, text: "What is TF-IDF and cosine similarity?" },
];

interface ChatAreaProps {
  messages: LocalMessage[];
  isLoading: boolean;
  activeConvId: number | null;
  onSend: (msg: string) => void;
  onStop: () => void;
  onClear: () => void;
}

export function ChatArea({
  messages, isLoading, activeConvId, onSend, onStop, onClear,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Text-to-speech for last assistant message
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ""));
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  }, []);

  // Export chat as PDF
  const exportPdf = useCallback(() => {
    const content = messages
      .map((m) => `[${m.role.toUpperCase()}] ${m.content}`)
      .join("\n\n");
    const blob = new Blob([`CodeAlpha AI Chatbot — Chat Export\n${"=".repeat(40)}\n\n${content}`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      {!isEmpty && (
        <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm">
          <button
            onClick={exportPdf}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary"
          >
            <Download size={13} />
            Export
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-destructive/10"
          >
            Clear
          </button>
        </div>
      )}

      {/* Messages area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-6">
        {isEmpty ? (
          <Welcome onSuggest={onSend} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div key={msg.id}>
                <MessageBubble message={msg} />
                {/* TTS button for completed assistant messages */}
                {msg.role === "assistant" && !msg.isStreaming && msg.content && (
                  <div className="flex justify-start ml-11 mt-1">
                    <button
                      onClick={() => speak(msg.content)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100 px-1"
                      title="Read aloud"
                    >
                      🔊
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <TypingIndicator />
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={onSend} onStop={onStop} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

function Welcome({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center px-4 py-12">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
        <Bot size={32} className="text-primary" />
      </div>
      <h1 className="text-2xl font-semibold mb-2">CodeAlpha AI Chatbot</h1>
      <p className="text-muted-foreground text-sm mb-1 max-w-sm">
        Powered by Gemini AI with NLP-based FAQ matching using TF-IDF cosine similarity.
      </p>
      <p className="text-xs text-muted-foreground/60 mb-8">
        Built for CodeAlpha Internship
      </p>

      {/* NLP badge */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-xs">
        <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-border">
          TF-IDF Matching
        </span>
        <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-border">
          Cosine Similarity
        </span>
        <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-border">
          Gemini 2.5 Flash
        </span>
        <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-border">
          Voice Input
        </span>
        <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-border">
          Text-to-Speech
        </span>
      </div>

      {/* Suggestion chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
        {SUGGESTIONS.map(({ icon: Icon, text }) => (
          <button
            key={text}
            onClick={() => onSuggest(text)}
            className="flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-sm group"
          >
            <Icon size={16} className="text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
