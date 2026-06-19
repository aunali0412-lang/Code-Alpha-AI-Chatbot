import { useState, useMemo } from "react";
import { cn, formatDate } from "@/lib/utils";
import type { GeminiConversation } from "@workspace/api-client-react";
import {
  Plus, Trash2, MessageSquare, ChevronLeft, ChevronRight,
  Bot, Moon, Sun, User, Search, X
} from "lucide-react";

interface SidebarProps {
  conversations: GeminiConversation[];
  activeConvId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  isLoading: boolean;
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-primary/30 text-foreground rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

export function Sidebar({
  conversations, activeConvId, onSelect, onNew, onDelete,
  theme, onToggleTheme, isLoading,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered]   = useState<number | null>(null);
  const [query, setQuery]       = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, query]);

  // Group by date
  const groups: Record<string, GeminiConversation[]> = {};
  for (const c of filtered) {
    const label = formatDate(c.createdAt);
    if (!groups[label]) groups[label] = [];
    groups[label]!.push(c);
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-border bg-sidebar transition-all duration-300 relative",
        collapsed ? "w-14" : "w-64",
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 z-10 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-accent transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Header */}
      <div className={cn("flex items-center gap-2.5 p-4 border-b border-border", collapsed && "justify-center px-2")}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-semibold leading-tight">AI Chatbot</div>
            <div className="text-xs text-muted-foreground leading-tight">Gemini + NLP</div>
          </div>
        )}
      </div>

      {/* New Chat */}
      <div className={cn("p-3 pb-2", collapsed && "px-2")}>
        <button
          onClick={onNew}
          disabled={isLoading}
          className={cn(
            "w-full flex items-center gap-2 rounded-lg border border-border text-sm font-medium transition-all",
            "hover:bg-accent hover:text-accent-foreground hover:border-primary/30",
            "disabled:opacity-50",
            collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
          )}
        >
          <Plus size={16} className="flex-shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Search bar */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats…"
              className={cn(
                "w-full rounded-md border border-border bg-secondary/50 text-xs",
                "pl-7 pr-7 py-2 placeholder:text-muted-foreground/60",
                "focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50",
                "transition-colors",
              )}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {!collapsed && filtered.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-8 px-3">
            {query ? (
              <>
                <Search size={22} className="mx-auto mb-2 opacity-40" />
                No chats match<br />
                <span className="font-medium text-foreground/70">"{query}"</span>
              </>
            ) : (
              <>
                <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
                No conversations yet
              </>
            )}
          </div>
        )}

        {!collapsed && query && filtered.length > 0 && (
          <p className="text-xs text-muted-foreground px-2 py-1">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </p>
        )}

        {Object.entries(groups).map(([label, convs]) => (
          <div key={label} className="mb-2">
            {!collapsed && (
              <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                {label}
              </div>
            )}
            {convs.map((conv) => (
              <div
                key={conv.id}
                className="relative group"
                onMouseEnter={() => setHovered(conv.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <button
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-lg text-sm transition-all text-left",
                    collapsed ? "justify-center p-2.5" : "px-3 py-2",
                    activeConvId === conv.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-secondary text-foreground",
                  )}
                >
                  <MessageSquare size={14} className="flex-shrink-0 opacity-60" />
                  {!collapsed && (
                    <span className="truncate flex-1 text-xs">
                      {highlight(conv.title, query)}
                    </span>
                  )}
                </button>
                {!collapsed && hovered === conv.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-destructive/20 hover:text-destructive text-muted-foreground opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div className={cn("border-t border-border p-3 flex gap-2", collapsed && "flex-col items-center px-2")}>
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">Intern</div>
              <div className="text-xs text-muted-foreground truncate">CodeAlpha</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
