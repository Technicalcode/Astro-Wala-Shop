import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Minus } from "lucide-react";
import { getBotReply, suggestedQuestions } from "../data/botKnowledge";
import Editable from "./editable/Editable";

const WELCOME_MESSAGE = {
  role: "bot",
  text: "Namaste! 🙏 I'm AstroBot. I can help you find the right gemstones, rudraksha, track your orders, and answer any store-related questions!",
};

const QUICK_REPLIES = [
  "Suggest a gemstone for me",
  "How to track my order?",
  "Rudraksha benefits",
  "What is the return policy?",
  "Contact Support",
];

export default function AskAstroBot() {
  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const send = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = getBotReply(trimmed);
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
      setTyping(false);
    }, 500 + Math.random() * 500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const handleOpen = () => {
    setOpen(true);
    setMinimised(false);
  };

  return (
    <>
      {/* Floating launcher */}
      <Editable as="button" kind="button" id="astrobot-launcher" label="AstroBot Launcher Button"
        onClick={open ? () => setOpen(false) : handleOpen}
        aria-label={open ? "Close AstroBot" : "Open AstroBot"}
        className="fixed bottom-5 right-5 z-[60] h-14 w-14 rounded-full bg-brand shadow-xl flex items-center justify-center text-white hover:bg-brand-dark transition-colors">
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-gold-light animate-pulse" />
        )}
      </Editable>

      {/* Chat window */}
      {open && (
        <div className={`fixed right-5 z-[60] w-[min(360px,calc(100vw-2.5rem))] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ${
          minimised ? "bottom-24 h-14" : "bottom-24 h-[min(520px,calc(100vh-9rem))]"
        }`}>

          {/* Header */}
          <Editable as="div" kind="button" id="astrobot-header" label="AstroBot Header Background"
            className="bg-brand px-4 py-3 flex items-center gap-2 text-white shrink-0">
            <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center">
              <Sparkles size={16} className="text-gold-light" />
            </div>
            <div className="leading-tight flex-1">
              <Editable as="p" id="astrobot-title" label="AstroBot Title"
                className="font-display font-semibold text-sm">Ask AstroBot</Editable>
              <Editable as="p" id="astrobot-subtitle" label="AstroBot Subtitle"
                className="text-[10px] text-white/70">
                {typing ? "Typing..." : "Your Astro Shop Assistant"}
              </Editable>
            </div>
            {/* Minimise button */}
            <button onClick={() => setMinimised((v) => !v)}
              aria-label={minimised ? "Expand chat" : "Minimise chat"}
              className="text-white/70 hover:text-white ml-auto">
              <Minus size={18} />
            </button>
          </Editable>

          {!minimised && (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-gray-50">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "bg-brand text-white rounded-br-sm"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-xl rounded-bl-sm px-3 py-2.5 flex gap-1 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-brand/50 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-brand/50 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-brand/50 animate-bounce" />
                    </div>
                  </div>
                )}

                {/* Quick replies — show after welcome or after each bot reply */}
                {!typing && messages[messages.length - 1]?.role === "bot" && (
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {(messages.length === 1 ? suggestedQuestions : QUICK_REPLIES).map((q) => (
                      <button key={q} onClick={() => send(q)}
                        className="text-[11px] bg-white border border-gray-200 text-gray-600 rounded-full px-2.5 py-1 hover:border-brand hover:text-brand transition-colors shadow-sm">
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit}
                className="border-t border-gray-200 p-2.5 flex gap-2 shrink-0 bg-white">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1 text-[13px] rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30" />
                <Editable as="button" kind="button" id="astrobot-send-btn" label="AstroBot Send Button"
                  type="submit" aria-label="Send message"
                  className="h-9 w-9 rounded-lg bg-brand text-white flex items-center justify-center hover:bg-brand-dark transition-colors shrink-0">
                  <Send size={15} />
                </Editable>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
