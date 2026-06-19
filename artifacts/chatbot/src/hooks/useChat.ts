import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListGeminiConversations,
  useCreateGeminiConversation,
  useDeleteGeminiConversation,
  useGetGeminiConversation,
  getListGeminiConversationsQueryKey,
  getGetGeminiConversationQueryKey,
} from "@workspace/api-client-react";
import { generateTitle } from "@/lib/utils";

export interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  nlpMatched?: boolean;
  nlpScore?: number;
  nlpQuestion?: string | null;
  isStreaming?: boolean;
  source?: "faq" | "gemini";
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function useChat() {
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { data: conversations = [], isLoading: convLoading } =
    useListGeminiConversations();

  const createConv = useCreateGeminiConversation();
  const deleteConv = useDeleteGeminiConversation();

  const { data: convData } = useGetGeminiConversation(activeConvId ?? 0, {
    query: {
      enabled: activeConvId !== null,
      queryKey: getGetGeminiConversationQueryKey(activeConvId ?? 0),
    },
  });

  const loadConversation = useCallback(
    async (id: number) => {
      setActiveConvId(id);
      setMessages([]);
      const data = await queryClient.fetchQuery({
        queryKey: getGetGeminiConversationQueryKey(id),
        queryFn: async () => {
          const res = await fetch(`${BASE}/api/gemini/conversations/${id}`);
          return res.json();
        },
      });
      if (data?.messages) {
        setMessages(
          data.messages.map((m: any) => ({
            id: String(m.id),
            role: m.role,
            content: m.content,
            createdAt: new Date(m.createdAt),
            source: m.role === "assistant" ? "gemini" : undefined,
          })),
        );
      }
    },
    [queryClient],
  );

  const startNewChat = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
  }, []);

  const deleteConversation = useCallback(
    async (id: number) => {
      await deleteConv.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    },
    [deleteConv, queryClient, activeConvId],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      let convId = activeConvId;

      // Create a new conversation if none active
      if (convId === null) {
        const title = generateTitle(content);
        const conv = await createConv.mutateAsync({ data: { title } });
        convId = conv.id;
        setActiveConvId(convId);
        queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
      }

      // Add user message locally
      const userMsg: LocalMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Add streaming placeholder
      const assistantId = `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          createdAt: new Date(),
          isStreaming: true,
        },
      ]);

      abortRef.current = new AbortController();

      try {
        const response = await fetch(
          `${BASE}/api/gemini/conversations/${convId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
            signal: abortRef.current.signal,
          },
        );

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let nlpMatched = false;
        let nlpScore = 0;
        let nlpQuestion: string | null = null;
        let accumulated = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));

              if (parsed.nlp) {
                nlpMatched = parsed.nlp.matched;
                nlpScore = parsed.nlp.score;
                nlpQuestion = parsed.nlp.question;
              } else if (parsed.content) {
                accumulated += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: accumulated, isStreaming: true }
                      : m,
                  ),
                );
              } else if (parsed.done) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          isStreaming: false,
                          nlpMatched,
                          nlpScore,
                          nlpQuestion,
                          source: nlpMatched ? "faq" : "gemini",
                        }
                      : m,
                  ),
                );
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: "Sorry, something went wrong. Please try again.",
                    isStreaming: false,
                  }
                : m,
            ),
          );
        }
      } finally {
        setIsLoading(false);
        queryClient.invalidateQueries({
          queryKey: getGetGeminiConversationQueryKey(convId!),
        });
      }
    },
    [activeConvId, isLoading, createConv, queryClient],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages((prev) =>
      prev.map((m) =>
        m.isStreaming ? { ...m, isStreaming: false } : m,
      ),
    );
  }, []);

  return {
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
  };
}
