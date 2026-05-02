import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { chatHistory } from "@/lib/mockData";
import { Send, Sparkles } from "lucide-react";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

function ChatPage() {
  const [messages, setMessages] = useState(chatHistory);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { id: `u${Date.now()}`, role: "user" as const, text: input };
    const aiMsg = { id: `a${Date.now()}`, role: "ai" as const, text: "Based on your current sensor data, I'd recommend monitoring this for 6h then reassessing. Your recent dosing log looks within tolerance." };
    setMessages([...messages, userMsg, aiMsg]);
    setInput("");
  };

  const suggestions = [
    "Why is EC dropping?",
    "Best pH for flowering?",
    "Diagnose Flower Room 2",
  ];

  return (
    <MobileShell>
      <AppHeader subtitle="AI Copilot" title="Ask Growy" />

      <div className="px-5 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              m.role === "user"
                ? "bg-gradient-primary text-primary-foreground rounded-br-sm shadow-card"
                : "bg-card border border-border rounded-bl-sm shadow-card"
            }`}>
              {m.role === "ai" && (
                <div className="flex items-center gap-1.5 mb-1.5 text-primary">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Growy AI</span>
                </div>
              )}
              <p>{m.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 mt-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-full bg-card border border-border text-muted-foreground hover:bg-accent transition-smooth"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-[400px] z-30">
        <div className="bg-card border border-border rounded-3xl shadow-elev p-2 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about your grow..."
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={send}
            className="w-10 h-10 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-card"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
