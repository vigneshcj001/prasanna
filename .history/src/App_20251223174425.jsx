import React, { useEffect, useRef, useState, useCallback } from "react";
import { SiOpenai } from "react-icons/si";
import { FiMessageSquare, FiX, FiSend } from "react-icons/fi";
import botAvatar from "../../images/vignesh.png";
import userAvatar from "../../images/vignesh.png";

const BACKEND = "https://vigneshwarancj-portfolio-backend.onrender.com";

const STARTER_QUESTIONS = [
  "What are Prasanna's main skills?",
  "Tell me about the Syncly project.",
  "How does GlycanBench work?",
  "What tech stack does he use?",
  "Summarize his research interests.",
];

const INITIAL_MESSAGE = {
  id: 1,
  from: "bot",
  text: "Hi! I'm Prasanna's AI assistant. Ask me anything or try a suggestion below 🚀",
  time: new Date(),
};

function MessageBubble({ from, text }) {
  const isUser = from === "user";
  const avatar = isUser ? userAvatar : botAvatar;
  const alt = isUser ? "You" : "Vigneshwaran";

  return (
    <div
      className={`flex gap-2 items-end ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <img
        src={avatar}
        className="w-8 h-8 rounded-full shadow border"
        alt={alt}
        loading="lazy"
      />
      <div
        className={`px-3 py-2 rounded-2xl max-w-[75%] text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-white text-gray-900 rounded-bl-none"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

export default function PortfolioAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [activeChip, setActiveChip] = useState(null);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const typingIntervalRef = useRef(null);

  // Auto scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Autofocus input when chat opens
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Typewriter effect for bot replies (with first-letter fix)
  const typeMessage = useCallback((full, id) => {
    return new Promise((resolve) => {
      if (!full || !full.length) {
        resolve();
        return;
      }

      // Initialize first character immediately (fixes missing 1st letter)
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, text: full[0] } : m))
      );

      let i = 1; // start from second character
      typingIntervalRef.current = setInterval(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, text: m.text + (full[i] || "") } : m
          )
        );
        i += 1;

        if (i >= full.length) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
          resolve();
        }
      }, 15);
    });
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const uId = Date.now();
      const bId = uId + 1;
      const now = new Date();

      // Add user message + bot placeholder
      setMessages((prev) => [
        ...prev,
        { id: uId, from: "user", text: trimmed, time: now },
        { id: bId, from: "bot", text: "", time: now },
      ]);

      setInput("");
      setActiveChip(null);
      setLoading(true);

      try {
        const res = await fetch(`${BACKEND}/api/assistant`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });

        let reply = "Sorry, something went wrong.";
        if (res.ok) {
          const data = await res.json();
          reply = data.reply || reply;
        } else {
          const errBody = await res.json().catch(() => ({}));
          reply = errBody.detail || reply;
        }

        await typeMessage(reply, bId);
      } catch (e) {
        console.error("Assistant request failed:", e);
        await typeMessage("Network error. Please try again.", bId);
      } finally {
        setLoading(false);
      }
    },
    [loading, typeMessage]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
  };

  const handleChipClick = (q, idx) => {
    setInput(q);
    setActiveChip(idx);
    // If you want second-click-to-send, you can do:
    // if (input.trim() === q.trim()) sendMessage(q);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition transform z-50"
          aria-label="Open Vigneshwaran AI Assistant"
        >
          <FiMessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div
          className="
            fixed bottom-6 right-6
            w-96 max-w-[92vw]
            bg-white/80 backdrop-blur-xl border border-gray-200
            rounded-2xl shadow-2xl
            flex flex-col
            max-h-[70vh]
            z-50
            animate-[fadeIn_0.2s_ease]
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-700 to-blue-600 text-white rounded-t-2xl shadow shrink-0">
            <div className="flex items-center gap-2">
              <SiOpenai className="w-5 h-5" />
              <p className="font-semibold text-sm">Vigneshwaran AI Assistant</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="hover:bg-white/20 p-1 rounded-full"
              aria-label="Close assistant"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Messages (scrollable) */}
          <div
            ref={scrollRef}
            className="flex-1 px-4 py-3 space-y-3 overflow-y-auto bg-gray-50"
          >
            {messages.map((m) => (
              <MessageBubble key={m.id} from={m.from} text={m.text} />
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 pl-2 animate-pulse">
                <span className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                </span>
                Vigneshwaran is typing...
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          <div className="flex gap-2 px-3 py-2 overflow-x-auto border-t bg-white shrink-0">
            {STARTER_QUESTIONS.map((q, i) => (
              <button
                key={q}
                type="button"
                onClick={() => handleChipClick(q, i)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-medium border transition ${
                  activeChip === i
                    ? "bg-black text-white"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-3 border-t bg-gray-50 rounded-b-2xl shrink-0"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setActiveChip(null);
              }}
              className="flex-1 px-3 py-2 rounded-lg border text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ask about skills, research, or projects..."
              aria-label="Ask the AI assistant about Vigneshwaran"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow flex items-center justify-center"
              aria-label="Send message"
            >
              <FiSend />
            </button>
          </form>
        </div>
      )}
    </>
  );
}