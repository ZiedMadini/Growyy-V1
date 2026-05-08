import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { GrowyBot } from "@/components/GrowyBot";
import { useAuth } from "@/contexts/AuthContext";
import { Send } from "lucide-react";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

type Message = { id: string; role: "user" | "ai"; text: string };

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/#{1,6}\s*/g, "")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .trim();
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [talking, setTalking] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [ollamaDown, setOllamaDown] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async () => {
    if (!input.trim() || !user) return;
    const text = input.trim();
    const userMsg: Message = { id: `u${Date.now()}`, role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);
    setOllamaDown(false);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, message: text, sessionId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 503) {
          setOllamaDown(true);
          throw new Error("ollama_down");
        }
        throw new Error(err.detail ?? "Request failed");
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setThinking(false);
      setTalking(true);
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: "ai", text: stripMarkdown(data.reply) }]);
      setTimeout(() => setTalking(false), 1800);
    } catch (err) {
      setThinking(false);
      if (err instanceof Error && err.message !== "ollama_down") {
        setMessages((m) => [
          ...m,
          {
            id: `e${Date.now()}`,
            role: "ai",
            text: "Something went wrong. Please try again.",
          },
        ]);
      }
    }
  };

  const suggestions = ["How are my rooms doing?", "Why is EC dropping?", "Best pH for flowering?"];

  return (
    <MobileShell bgVariant="leaves">
      <AppHeader title="Ask Growy" />

      <div className="flex justify-center mb-4">
        <GrowyBot isThinking={thinking} isTalking={talking} size={96} />
      </div>

      {ollamaDown && (
        <div
          className="mx-5 mb-3 rounded-2xl px-4 py-3 text-xs text-warning"
          style={{
            background: "rgba(255,209,102,0.10)",
            border: "1px solid rgba(255,209,102,0.2)",
          }}
        >
          AI chat is offline — Ollama is not running on the server. Start it with{" "}
          <span className="font-mono">ollama serve</span>.
        </div>
      )}

      <div className="px-5 space-y-3 pb-40">
        {messages.length === 0 && !thinking && (
          <div className="text-center py-8">
            <p className="text-sm text-ink-dim">Ask me anything about your grow.</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "rounded-br-sm text-[#06120a]"
                    : "glass rounded-bl-sm text-ink"
                }`}
                style={
                  m.role === "user"
                    ? {
                        background: "linear-gradient(135deg, #2EA84A, #5fd47e)",
                        boxShadow: "0 4px 16px rgba(46,168,74,0.35)",
                      }
                    : undefined
                }
              >
                {m.text}
              </div>
            </motion.div>
          ))}
          {thinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-end">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div className="px-5 fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-30">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full glass text-ink-dim active:scale-95 transition-transform"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="glass-strong rounded-full p-1.5 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about your grow..."
            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none text-ink placeholder:text-ink-soft"
            suppressHydrationWarning
          />
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={send}
            disabled={thinking}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#06120a]"
            style={{
              background: thinking
                ? "rgba(46,168,74,0.4)"
                : "linear-gradient(135deg, #2EA84A, #5fd47e)",
              boxShadow: "0 4px 14px rgba(46,168,74,0.4)",
            }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </MobileShell>
  );
}
