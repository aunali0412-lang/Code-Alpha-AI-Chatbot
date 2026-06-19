import { useEffect, useRef, useCallback } from "react";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import type { LocalMessage } from "@/hooks/useChat";
import { Bot, Sparkles, Zap, BookOpen, Code2, FileDown } from "lucide-react";
import jsPDF from "jspdf";

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ""));
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  }, []);

  const exportPdf = useCallback(() => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = pageW - margin * 2;

    // ── Header bar ──────────────────────────────────────────────────────
    doc.setFillColor(15, 23, 42); // dark navy
    doc.rect(0, 0, pageW, 28, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text("CodeAlpha AI Chatbot", margin, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Powered by Gemini AI · NLP FAQ Matching (TF-IDF + Cosine Similarity)", margin, 19);

    const exportDate = new Date().toLocaleString();
    doc.text(`Exported: ${exportDate}`, pageW - margin, 19, { align: "right" });

    // ── Stats bar ────────────────────────────────────────────────────────
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 28, pageW, 12, "F");

    const userCount = messages.filter((m) => m.role === "user").length;
    const faqCount  = messages.filter((m) => m.source === "faq").length;
    const aiCount   = messages.filter((m) => m.source === "gemini").length;

    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Messages: ${messages.length}`, margin, 35);
    doc.text(`Questions: ${userCount}`, margin + 40, 35);
    doc.text(`FAQ answers: ${faqCount}`, margin + 85, 35);
    doc.text(`Gemini AI answers: ${aiCount}`, margin + 135, 35);

    // ── Messages ─────────────────────────────────────────────────────────
    let y = 48;
    const lineH = 5.5;
    const bubblePad = 3.5;
    const avatarR = 4;

    const addPage = () => {
      // Footer on current page
      doc.setFillColor(15, 23, 42);
      doc.rect(0, pageH - 10, pageW, 10, "F");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("CodeAlpha Internship Project — AI Chatbot", margin, pageH - 3.5);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageW - margin, pageH - 3.5, { align: "right" });

      doc.addPage();
      y = 18;
    };

    for (const msg of messages) {
      const isUser = msg.role === "user";

      // Strip markdown for clean PDF text
      const raw = msg.content
        .replace(/```[\s\S]*?```/g, (m) => m.replace(/```[^\n]*/g, "").trim())
        .replace(/[*_`#]/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const lines = doc.splitTextToSize(raw, contentW - avatarR * 2 - 12);
      const bubbleH = lines.length * lineH + bubblePad * 2 + 8;

      if (y + bubbleH > pageH - 18) addPage();

      // Avatar circle
      if (isUser) {
        doc.setFillColor(99, 102, 241); // indigo
        doc.circle(pageW - margin - avatarR, y + avatarR, avatarR, "F");
        doc.setFontSize(6);
        doc.setTextColor(255, 255, 255);
        doc.text("U", pageW - margin - avatarR, y + avatarR + 1.8, { align: "center" });
      } else {
        doc.setFillColor(16, 185, 129); // emerald
        doc.circle(margin + avatarR, y + avatarR, avatarR, "F");
        doc.setFontSize(6);
        doc.setTextColor(255, 255, 255);
        doc.text("AI", margin + avatarR, y + avatarR + 1.8, { align: "center" });
      }

      // Bubble background
      const bx = isUser ? margin + avatarR * 2 + 4 : margin + avatarR * 2 + 4;
      const bw = contentW - avatarR * 2 - 6;

      if (isUser) {
        doc.setFillColor(238, 242, 255); // indigo-50
        doc.setDrawColor(199, 210, 254); // indigo-200
      } else {
        doc.setFillColor(240, 253, 250); // emerald-50
        doc.setDrawColor(167, 243, 208); // emerald-200
      }
      doc.roundedRect(bx, y, bw, bubbleH, 3, 3, "FD");

      // Role label + NLP badge
      const labelX = bx + bubblePad;
      const labelY = y + bubblePad + 3.5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(isUser ? 79 : 5, isUser ? 70 : 150, isUser ? 229 : 105);
      doc.text(isUser ? "You" : "CodeAlpha AI", labelX, labelY);

      // NLP badge
      if (!isUser && msg.source) {
        const badgeLabel = msg.source === "faq"
          ? `FAQ match · score ${(msg.nlpScore ?? 0).toFixed(2)}`
          : "Gemini AI";
        const badgeX = bx + bw - bubblePad - doc.getTextWidth(badgeLabel) - 3;

        doc.setFillColor(msg.source === "faq" ? 220 : 239,
                         msg.source === "faq" ? 252 : 246,
                         msg.source === "faq" ? 231 : 255);
        doc.roundedRect(badgeX - 1.5, labelY - 4, doc.getTextWidth(badgeLabel) + 4, 5.5, 1, 1, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(msg.source === "faq" ? 22 : 109,
                         msg.source === "faq" ? 163 : 40,
                         msg.source === "faq" ? 74 : 217);
        doc.text(badgeLabel, badgeX, labelY);
      }

      // Timestamp
      const ts = msg.createdAt
        ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(156, 163, 175);
      doc.text(ts, bx + bw - bubblePad, labelY, { align: "right" });

      // Message text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(lines, labelX, labelY + 5.5);

      y += bubbleH + 5;
    }

    // Footer on last page
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("CodeAlpha Internship Project — AI Chatbot", margin, pageH - 3.5);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageW - margin, pageH - 3.5, { align: "right" });

    const filename = `codealpha-chat-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  }, [messages]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {!isEmpty && (
        <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm">
          <button
            onClick={exportPdf}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary"
          >
            <FileDown size={13} />
            Export PDF
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-destructive/10"
          >
            Clear
          </button>
        </div>
      )}

      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-6">
        {isEmpty ? (
          <Welcome onSuggest={onSend} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div key={msg.id}>
                <MessageBubble message={msg} />
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

      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-xs">
        <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-border">TF-IDF Matching</span>
        <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-border">Cosine Similarity</span>
        <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-border">Gemini 2.5 Flash</span>
        <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-border">Voice Input</span>
        <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-border">Text-to-Speech</span>
        <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-border">PDF Export</span>
      </div>

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
