import React, { useEffect, useRef, useState, useCallback } from "react";
import { SiOpenai } from "react-icons/si";
import { FiSend } from "react-icons/fi";

const BACKEND = "https://prasanna-2gan.onrender.com";

const STARTER_QUESTIONS = [
  "What are Prasanna's key skills?",
  "Summarize his work experience",
  "What industries has he worked with?",
  "What digital marketing tools does he use?"
];

const INITIAL_MESSAGE = {
  id: 1,
  from: "bot",
  text: "Hello. I am Prasanna’s AI Portfolio Assistant. Ask me anything about his professional background.",
};

function MessageBubble({ from, text }) {
  const isUser = from === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed rounded-2xl shadow-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-white text-gray-800 border rounded-bl-sm"
        }`}
      >
        {text.split("\n").map((line, i) => (
          <p key={i} className="mb-1 last:mb-0">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef(null);
  const typingRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Typewriter animation
  const typeMessage = useCallback((fullText, id) => {
    return new Promise((resolve) => {
      let index = 0;

      typingRef.current = setInterval(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...m, text: fullText.slice(0, index + 1) }
              : m
          )
        );

        index++;
        if (index >= fullText.length) {
          clearInterval(typingRef.current);
          resolve();
        }
      }, 12);
    });
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userId = Date.now();
    const botId = userId + 1;

    setMessages((prev) => [
      ...prev,
      { id: userId, from: "user", text },
      { id: botId, from: "bot", text: "" },
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
      await typeMessage(data.reply || "No response available.", botId);
    } catch {
      await typeMessage(
        "Unable to connect to the server. Please try again later.",
        botId
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-700 to-blue-600 text-white shadow-md">
        <SiOpenai className="w-6 h-6" />
        <h1 className="text-lg font-semibold">Prasanna AI Assistant</h1>
      </header>

      {/* Chat Area */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} from={msg.from} text={msg.text} />
        ))}

        {loading && (
          <div className="text-xs text-gray-400 animate-pulse">
            Assistant is typing...
          </div>
        )}
      </main>

      {/* Starter Questions */}
      <div className="px-6 py-3 bg-white border-t flex gap-2 overflow-x-auto">
        {STARTER_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            className="px-4 py-2 text-xs bg-gray-200 rounded-full hover:bg-gray-300 transition whitespace-nowrap"
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
        className="flex items-center gap-3 px-6 py-4 bg-white border-t"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Type your question here..."
          className="flex-1 px-4 py-3 border rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
        />

        <button
          type="submit"
          disabled={loading}
          className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
}
