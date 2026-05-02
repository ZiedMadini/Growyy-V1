import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { GrowyBot } from "@/components/GrowyBot";
import { chatHistory } from "@/lib/mockData";
import { Send } from "lucide-react";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

function ChatPage() {
  const [messages, setMessages] = useState(chatHistory);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [talking, setTalking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { id: `u${Date.now()}`, role: "user" as const, text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setTalking(true);
      const aiMsg = {
        id: `a${Date.now()}`,
        role: "ai" as const,
        text: "Based on your live sensor data, monitor for 6h then reassess. Your recent dosing log is within tolerance — the trend is healthy.",
      };
      setMessages((m) => [...m, aiMsg]);
      setTimeout(() => setTalking(false), 1800);
    }, 1400);
  };

  const suggestions = ["Why is EC dropping?", "Best pH for flowering?", "Diagnose Flower Room 2"];

  return (
    <MobileShell bgVariant="leaves">
      <AppHeader subtitle="AI Copilot" title="Ask Growy" />

      {/* Bot hero */}
      <div className="flex justify-center mb-4">
        <GrowyBot isThinking={thinking} isTalking={talking} size={96} />
      </div>

      <div className="px-5 space-y-3 pb-40">
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
              <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
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
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#06120a]"
            style={{
              background: "linear-gradient(135deg, #2EA84A, #5fd47e)",
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
