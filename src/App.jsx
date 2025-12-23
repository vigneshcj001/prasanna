import React, { useEffect, useRef, useState, useCallback } from "react";
import { SiOpenai } from "react-icons/si";
import { FiSend } from "react-icons/fi";

const BACKEND = "https://vigneshwarancj-portfolio-backend.onrender.com";

const STARTER_QUESTIONS = [
  "What are Prasanna's main skills?",

  "What tech stack does he use?",
  "Summarize his research interests.",
];

const INITIAL_MESSAGE = {
  id: 1,
  from: "bot",
  text: "Hi! I'm Prasanna's AI assistant. Ask me anything.",
  time: new Date(),
};

function MessageBubble({ from, text }) {
  const isUser = from === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-4 py-3 rounded-xl max-w-[70%] text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-900"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef(null);
  const typingIntervalRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Typewriter effect
  const typeMessage = useCallback((full, id) => {
    return new Promise((resolve) => {
      if (!full) return resolve();

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, text: full[0] } : m))
      );

      let i = 1;
      typingIntervalRef.current = setInterval(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, text: m.text + (full[i] || "") } : m
          )
        );
        i++;

        if (i >= full.length) {
          clearInterval(typingIntervalRef.current);
          resolve();
        }
      }, 15);
    });
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const uId = Date.now();
    const bId = uId + 1;

    setMessages((prev) => [
      ...prev,
      { id: uId, from: "user", text },
      { id: bId, from: "bot", text: "" },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      await typeMessage(data.reply || "No response.", bId);
    } catch {
      await typeMessage("Network error. Please try again.", bId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-700 to-blue-600 text-white shadow">
        <SiOpenai className="w-6 h-6" />
        <h1 className="font-semibold text-lg">
         Prasanna AI Assistant
        </h1>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} from={m.from} text={m.text} />
        ))}

        {loading && (
          <p className="text-xs text-gray-400">Typing...</p>
        )}
      </div>

      {/* Suggestions */}
      <div className="px-6 py-2 flex gap-2 overflow-x-auto bg-white border-t">
        {STARTER_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            className="text-xs px-3 py-1 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2 px-6 py-4 bg-white border-t"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
}
