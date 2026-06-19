import { cn, formatTime, parseMarkdown } from "@/lib/utils";
import type { LocalMessage } from "@/hooks/useChat";
import { Bot, User, Sparkles, BookOpen, Copy, Check } from "lucide-react";
import { useState } from "react";

interface MessageBubbleProps {
  message: LocalMessage;
}

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 msg-in">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        <Bot size={15} className="text-primary-foreground" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span className="typing-dot w-2 h-2 bg-muted-foreground rounded-full inline-block" />
          <span className="typing-dot w-2 h-2 bg-muted-foreground rounded-full inline-block" />
          <span className="typing-dot w-2 h-2 bg-muted-foreground rounded-full inline-block" />
        </div>
      </div>
    </div>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex items-end gap-3 msg-in group", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm",
          isUser ? "bg-secondary border border-border" : "bg-primary",
        )}
      >
        {isUser ? (
          <User size={15} className="text-foreground" />
        ) : (
          <Bot size={15} className="text-primary-foreground" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn("max-w-[75%] flex flex-col gap-1", isUser && "items-end")}>
        {/* NLP source badge */}
        {!isUser && message.source && !message.isStreaming && (
          <div className="flex items-center gap-1.5 px-1">
            {message.source === "faq" ? (
              <span className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400">
                <BookOpen size={11} />
                FAQ match
                {message.nlpScore !== undefined && (
                  <span className="opacity-60">({Math.round(message.nlpScore * 100)}%)</span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-primary/70">
                <Sparkles size={11} />
                Gemini AI
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed relative",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-card border border-border rounded-bl-sm text-foreground",
            message.isStreaming && "after:content-['▋'] after:animate-pulse after:text-primary after:ml-0.5",
          )}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
          ) : (
            <div
              className="prose prose-sm max-w-none dark:prose-invert break-words"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) || "…" }}
            />
          )}
        </div>

        {/* Timestamp + copy */}
        <div className={cn("flex items-center gap-2 px-1", isUser && "flex-row-reverse")}>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
          {!isUser && !message.isStreaming && message.content && (
            <button
              onClick={copy}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
