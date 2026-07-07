"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../app/providers";
import { Send, Mic, MicOff, Bot, Sparkles, User, RefreshCw } from "lucide-react";

interface Message {
  role: "user" | "model";
  text: string;
}

// Simple markdown renderer for AI responses
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let isOrdered = false;

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    const Tag = isOrdered ? 'ol' : 'ul';
    elements.push(
      <Tag key={key} className={isOrdered ? '' : ''}>
        {listItems.map((item, i) => <li key={i}>{inlineFormat(item)}</li>)}
      </Tag>
    );
    listItems = [];
  };

  const inlineFormat = (s: string): React.ReactNode => {
    // Bold: **text**
    const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2,-2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1,-1)}</em>;
      if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-slate-700 px-1 rounded text-xs">{part.slice(1,-1)}</code>;
      return part;
    });
  };

  lines.forEach((line, idx) => {
    const unordered = line.match(/^[\-\*] (.+)/);
    const ordered = line.match(/^\d+\. (.+)/);
    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);

    if (unordered) {
      if (isOrdered) { flushList(`list-${idx}`); }
      isOrdered = false;
      listItems.push(unordered[1]);
    } else if (ordered) {
      if (!isOrdered) { flushList(`list-${idx}`); }
      isOrdered = true;
      listItems.push(ordered[1]);
    } else {
      flushList(`list-${idx}`);
      if (h1) elements.push(<h1 key={idx} className="text-base font-bold text-white mt-2 mb-1">{inlineFormat(h1[1])}</h1>);
      else if (h2) elements.push(<h2 key={idx} className="text-sm font-bold text-orange-300 mt-2 mb-1">{inlineFormat(h2[1])}</h2>);
      else if (h3) elements.push(<h3 key={idx} className="text-sm font-semibold text-slate-200 mt-1.5 mb-0.5">{inlineFormat(h3[1])}</h3>);
      else if (line.trim() === '') elements.push(<br key={idx} />);
      else elements.push(<p key={idx} className="leading-relaxed">{inlineFormat(line)}</p>);
    }
  });
  flushList('final');
  return <div className="prose-chat space-y-0.5">{elements}</div>;
}

export default function ChatWidget({ hero = false }: { hero?: boolean }) {
  const { t, language } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize greeting message on mount/lang change
  useEffect(() => {
    setMessages([
      {
        role: "model",
        text: language === "hi"
          ? "नमस्ते! मैं NagrikAI हूँ। मैं सरकारी योजनाओं, सेवाओं और शिकायतों के बारे में आपकी सहायता कर सकता हूँ। कृपया अपना प्रश्न पूछें।"
          : language === "ta"
          ? "வணக்கம்! நான் NagrikAI. அரசு திட்டங்கள், சேவைகள் மற்றும் புகார்கள் குறித்து நான் உங்களுக்கு உதவ முடியும். தயவுசெய்து உங்கள் கேள்வியைக் கேட்கவும்."
          : language === "bn"
          ? "নমস্কার! আমি NagrikAI। আমি সরকারি প্রকল্প, পরিষেবা এবং অভিযোগ সম্পর্কে আপনাকে সাহায্য করতে পারি। আপনার প্রশ্নটি জিজ্ঞেস করুন।"
          : "Hello! I am NagrikAI. I can assist you with information on government schemes, eligibility, documents, or help you file and track complaints. What can I do for you today?"
      }
    ]);
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up Web Speech API recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === "hi" ? "hi-IN" : language === "ta" ? "ta-IN" : language === "bn" ? "bn-IN" : "en-IN";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please try Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Call the Next.js server-side API route (which calls Gemini directly)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          history: messages.map((m) => ({
            role: m.role,
            text: m.text
          })),
          language: language
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { role: "model", text: data.response }]);
      } else {
        throw new Error("API call failed");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: language === "hi"
            ? "क्षमा करें, वर्तमान में सेवा से संपर्क नहीं हो पा रहा है।"
            : "Sorry, I am unable to connect to the backend service right now."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chipTextKey: string) => {
    const text = t(chipTextKey);
    handleSend(text);
  };

  return (
    <div className={hero ? "w-full" : "w-full border rounded-2xl flex flex-col shadow-sm overflow-hidden"}
      style={hero ? {} : { borderColor: "var(--outline-variant)", background: "white" }}>

      {/* Hero mode: just input + chips + chat history */}
      {hero ? (
        <>
          {/* Suggestion chips */}
          {messages.length === 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {["chip_birth", "chip_awas", "chip_light"].map((key) => (
                <button
                  key={key}
                  onClick={() => handleChipClick(key)}
                  className="px-4 py-2 text-xs font-semibold rounded-full border transition-all hover:opacity-80"
                  style={{ background: "var(--surface-container-high)", color: "var(--on-surface)", borderColor: "var(--outline-variant)" }}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex items-center gap-3 mb-5 w-full max-w-2xl mx-auto">
            <div className="relative flex-1 flex items-center rounded-full border shadow-sm transition-all focus-within:ring-2"
              style={{ background: "white", borderColor: "var(--outline)", ['--tw-ring-color' as any]: "var(--primary)" }}>
              <input
                type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat_placeholder")}
                className="w-full bg-transparent border-none text-sm outline-none px-6 py-4 placeholder:text-gray-400"
                disabled={loading}
                aria-label="Ask BharatGPT assistant"
                style={{ color: "var(--on-surface)" }}
              />
              <button type="button" onClick={toggleListening}
                aria-label="Toggle voice input"
                className={`p-2 mr-2 rounded-full transition-all ${ isListening ? "bg-red-100 text-red-600" : "text-gray-400 hover:text-gray-600"}`}>
                {isListening
                  ? <span className="material-symbols-outlined text-lg">mic_off</span>
                  : <span className="material-symbols-outlined text-lg">mic</span>}
              </button>
            </div>
            <button type="submit"
              aria-label="Send message"
              className="p-4 rounded-full text-white shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              disabled={!input.trim() || loading}
              style={{ background: "var(--primary)" }}>
              <span className="material-symbols-outlined text-xl">send</span>
            </button>
          </form>

          {/* Chat history (below input in hero mode) */}
          {messages.length > 1 && (
            <div className="max-h-80 overflow-y-auto w-full max-w-2xl mx-auto rounded-2xl border p-4 space-y-3"
              style={{ background: "var(--surface-container-low)", borderColor: "var(--outline-variant)" }}>
              {messages.slice(1).map((msg, idx) => (
                <div key={idx} className={`flex message-animate ${ msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "text-white rounded-tr-none"
                      : "border rounded-tl-none"
                  }`}
                    style={msg.role === "user"
                      ? { background: "var(--primary)" }
                      : { background: "white", borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}>
                    {msg.role === "model" ? renderMarkdown(msg.text) : msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-none px-4 py-3 border flex items-center gap-1"
                    style={{ background: "white", borderColor: "var(--outline-variant)" }}>
                    <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--primary)" }}></span>
                    <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--primary)" }}></span>
                    <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--primary)" }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900"></span>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm md:text-base flex items-center">
              NagrikAI <Sparkles className="w-3.5 h-3.5 ml-1.5 text-amber-400 fill-amber-400" />
            </h3>
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Online Assistance</p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([
            {
              role: "model",
              text: language === "hi"
                ? "नमस्ते! मैं NagrikAI हूँ। मैं सरकारी योजनाओं, सेवाओं और शिकायतों के बारे में आपकी सहायता कर सकता हूँ। कृपया अपना प्रश्न पूछें।"
                : "Hello! I am NagrikAI. I can assist you with information on government schemes, eligibility, documents, or help you file and track complaints. What can I do for you today?"
            }
          ])}
          className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          title="Reset Conversation"
          aria-label="Reset Conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Welcome Prompt Block */}
      {messages.length === 1 && (
        <div className="absolute inset-x-0 top-16 bottom-20 flex flex-col justify-center items-center px-8 text-center bg-slate-900/95 z-10 overflow-y-auto">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4 border border-orange-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            {t("chat_greeting")}
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-md mb-8">
            {t("chat_subprompt")}
          </p>

          <div className="w-full max-w-md space-y-3">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-center">
              {t("try_asking")}
            </span>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => handleChipClick("chip_birth")}
                className="w-full text-left px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/40 text-xs md:text-sm text-slate-300 hover:text-white hover:bg-slate-900/60 transition-all duration-200"
              >
                💡 {t("chip_birth")}
              </button>
              <button
                onClick={() => handleChipClick("chip_awas")}
                className="w-full text-left px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/40 text-xs md:text-sm text-slate-300 hover:text-white hover:bg-slate-900/60 transition-all duration-200"
              >
                🏡 {t("chip_awas")}
              </button>
              <button
                onClick={() => handleChipClick("chip_light")}
                className="w-full text-left px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/40 text-xs md:text-sm text-slate-300 hover:text-white hover:bg-slate-900/60 transition-all duration-200"
              >
                💡 {t("chip_light")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat History Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/40">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex message-animate ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex items-start space-x-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                msg.role === "user" ? "bg-orange-500" : "bg-slate-800 border border-slate-700"
              }`}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-orange-400" />}
              </div>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "text-white rounded-tr-none"
                  : "border rounded-tl-none"
              }`}
                style={msg.role === "user"
                  ? { background: "var(--primary)" }
                  : { background: "var(--surface-container-low)", borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}>
                {msg.role === "model" ? renderMarkdown(msg.text) : msg.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start message-animate">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full border flex items-center justify-center"
                style={{ background: "white", borderColor: "var(--outline-variant)" }}>
                <span className="material-symbols-filled text-base" style={{ color: "var(--primary)" }}>smart_toy</span>
              </div>
              <div className="rounded-2xl rounded-tl-none px-5 py-3.5 border flex items-center space-x-1.5"
                style={{ background: "white", borderColor: "var(--outline-variant)" }}>
                <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--primary)" }}></span>
                <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--primary)" }}></span>
                <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--primary)" }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
        className="border-t p-4 flex items-center space-x-3"
        style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-low)" }}
      >
        <div className="relative flex-1 flex items-center rounded-full border transition-all"
          style={{ background: "white", borderColor: "var(--outline)" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat_placeholder")}
            className="w-full bg-transparent border-none outline-none px-4 py-3 text-sm placeholder:text-gray-400"
            disabled={loading}
            aria-label="Ask floating chat assistant"
            style={{ color: "var(--on-surface)" }}
          />
          <button
            type="button"
            onClick={toggleListening}
            aria-label="Toggle voice input"
            className={`p-2 mr-2 rounded-full transition-all ${isListening ? "bg-red-100 text-red-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            {isListening
              ? <span className="material-symbols-outlined text-lg">mic_off</span>
              : <span className="material-symbols-outlined text-lg">mic</span>}
          </button>
        </div>
        <button
          type="submit"
          aria-label="Send message"
          className="p-3 rounded-full text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
          disabled={!input.trim() || loading}
          style={{ background: "var(--primary)" }}
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
        </>
      )}
    </div>
  );
}
