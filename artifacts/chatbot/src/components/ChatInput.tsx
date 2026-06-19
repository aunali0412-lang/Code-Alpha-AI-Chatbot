import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Send, Mic, MicOff, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isLoading, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isLoading, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice input
  const toggleVoice = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]!.transcript)
        .join("");
      setValue(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening]);

  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border bg-card px-3 py-2.5 transition-all",
          "focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20",
          isListening && "border-red-400/60 ring-1 ring-red-400/20",
        )}
      >
        {/* Voice button */}
        <button
          type="button"
          onClick={toggleVoice}
          className={cn(
            "p-1.5 rounded-lg transition-all flex-shrink-0 mb-0.5",
            isListening
              ? "bg-red-500/15 text-red-500 animate-pulse"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary",
          )}
          title={isListening ? "Stop listening" : "Voice input"}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening…" : "Ask anything…"}
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground",
            "max-h-44 py-0.5 leading-relaxed",
            (disabled || isLoading) && "opacity-60",
          )}
        />

        {/* Send / Stop */}
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="p-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 transition-all flex-shrink-0 mb-0.5"
            title="Stop generating"
          >
            <Square size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className={cn(
              "p-1.5 rounded-lg transition-all flex-shrink-0 mb-0.5",
              value.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground opacity-40",
            )}
            title="Send (Enter)"
          >
            <Send size={15} />
          </button>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground mt-1.5 opacity-60">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
