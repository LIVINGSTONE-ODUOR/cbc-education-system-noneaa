import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, User, ArrowDown } from 'lucide-react';
import annaAvatar from '@/assets/anna.png'; // Anna AI assistant avatar
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const GREETING_TEXT = "Hi! I'm Anna, your AI assistant for the NONEAA platform. I can help you with anything related to Kenya's Competency-Based Education system. What would you like to know?";
const TYPING_SPEED_MS = 25;
const INPUT_MAX_HEIGHT_PX = 120;

const QUICK_PROMPTS = [
  'What is CBC?',
  'How does assessment work?',
  'Tell me about NONEAA',
  'CBC structure explained',
];

const SYSTEM_CONTEXT = `You are Anna, a friendly and knowledgeable AI assistant for the NONEAA CBE Education Platform. You strictly answer questions related to:
1. The Kenyan Competency-Based Education (CBE) system
2. The NONEAA platform features and functionality
3. How teachers, parents, and school administrators can use the platform
4. CBE curriculum structure, learning areas, strands, and competencies
5. Assessment methods under CBE (formative and summative)
6. The transition from 8-4-4 to the 2-6-3-3-3 education system
7. When asked about the developers who developed you, you say it's the Teksoft Developers Team they developed this Educational platform
8. If the user asks about a question that you don't know or you feel requires developers support, tell him/her you are connecting him with the Developers Team or provide the developers email contact@teksoft.co.ke

If asked about topics unrelated to CBE or this platform, politely redirect the conversation back to these topics.

Key CBE information:
- CBE focuses on learner competencies rather than content coverage
- The structure is: 2 years Early Years, 6 years Primary, 3 years Junior Secondary, 3 years Senior Secondary, 3+ years Tertiary
- Core competencies include: Communication, Collaboration, Critical Thinking, Creativity, Citizenship, Digital Literacy, Learning to Learn, Self-Efficacy
- Assessment is continuous and formative, focusing on competency development

Keep responses concise, helpful, and conversational. Use simple formatting. Be warm and approachable.`;

// Gemini API configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Backend AI endpoint (fallback if Gemini key not set)
const normalizeAiEndpoint = (raw?: string) => {
  const fallback = '/api/v1/ai/ai-chat';
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (/\/api\/ai-chat$/.test(trimmed)) {
    return trimmed.replace(/\/api\/ai-chat$/, '/api/v1/ai/ai-chat');
  }
  if (/\/api\/ai\/ai-chat$/.test(trimmed) && !/\/api\/v1\/ai\/ai-chat$/.test(trimmed)) {
    return trimmed.replace(/\/api\/ai\/ai-chat$/, '/api/v1/ai/ai-chat');
  }
  return trimmed;
};

const AI_API_ENDPOINT = normalizeAiEndpoint(import.meta.env.VITE_AI_API_ENDPOINT);

async function callGemini(messages: { role: string; content: string }[], systemPrompt: string): Promise<string> {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response. Please try again.';
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: GREETING_TEXT,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [greetingText, setGreetingText] = useState('');
  const [greetingComplete, setGreetingComplete] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const greetingStartedRef = useRef(false);
  const greetingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && !greetingStartedRef.current) {
      greetingStartedRef.current = true;
      const chars = Array.from(GREETING_TEXT);
      let charIndex = 0;
      const typeNextChar = () => {
        charIndex += 1;
        setGreetingText(chars.slice(0, charIndex).join(''));
        if (charIndex < chars.length) {
          greetingTimeoutRef.current = setTimeout(typeNextChar, TYPING_SPEED_MS);
        } else {
          setGreetingComplete(true);
        }
      };
      greetingTimeoutRef.current = setTimeout(typeNextChar, TYPING_SPEED_MS);
    }
    return () => {
      if (greetingTimeoutRef.current) {
        clearTimeout(greetingTimeoutRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollDown(!isNearBottom);
  }, []);

  const handleSendMessage = async (e?: React.FormEvent, customMessage?: string) => {
    e?.preventDefault();
    const messageText = customMessage || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      let reply: string;

      if (GEMINI_API_KEY) {
        reply = await callGemini(allMessages, SYSTEM_CONTEXT);
      } else {
        const accessToken = localStorage.getItem('cbe_access_token');
        const response = await fetch(AI_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            messages: allMessages,
            systemPrompt: SYSTEM_CONTEXT,
          }),
        });

        if (!response.ok) {
          throw new Error('ASSISTANT_OFFLINE');
        }

        const data = await response.json();
        reply =
          data?.data?.reply ||
          data?.message ||
          data?.content ||
          data?.data?.message ||
          'I apologize, but I encountered an issue. Please try again.';
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m having trouble connecting right now. Please try again in a moment, or reach out to us at contact@teksoft.co.ke for direct assistance.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, INPUT_MAX_HEIGHT_PX)}px`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <>
      {/* Modern Floating AI Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 group"
            aria-label="Open AI Assistant"
          >
            <div className="relative">
              {/* Pulse ring */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full animate-ping opacity-20" />
              {/* Button */}
              <div className="relative w-14 h-14 rounded-full shadow-lg shadow-blue-500/25 overflow-hidden ring-2 ring-violet-400/50">
                <img src={annaAvatar} alt="Anna" className="w-full h-full object-cover" />
              </div>
              {/* Label */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Ask Anna
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-3rem)] flex flex-col bg-white rounded-2xl shadow-2xl shadow-blue-900/10 border border-gray-200/80 overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-violet-600 via-blue-600 to-indigo-700 px-5 py-4 flex-shrink-0">
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
              </div>

              <div className="relative flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  <img src={annaAvatar} alt="Anna" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-indigo-600" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm">Anna</h3>
                  <p className="text-blue-100 text-xs">AI Assistant • Always online</p>
                </div>

                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2.5",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {/* Assistant avatar */}
                  {message.role === 'assistant' && (
                    <img src={annaAvatar} alt="Anna" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-1" />
                  )}

                  <div className={cn("max-w-[78%] flex flex-col", message.role === 'user' ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        message.role === 'user'
                          ? "bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-br-md"
                          : "bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-md"
                      )}
                    >
                      {message.id === '1' && !greetingComplete ? (
                        <span>
                          {greetingText}
                          <span className="inline-block w-0.5 h-3.5 bg-violet-500 ml-0.5 align-middle animate-pulse" aria-hidden="true" />
                        </span>
                      ) : (
                        <span className="whitespace-pre-wrap">{message.content}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>

                  {/* User avatar */}
                  {message.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3.5 h-3.5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2.5 justify-start">
                  <img src={annaAvatar} alt="Anna" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollDown && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-[140px] left-1/2 -translate-x-1/2 w-8 h-8 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center hover:shadow-lg transition"
                >
                  <ArrowDown className="w-4 h-4 text-gray-600" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Quick Prompts (shown when few messages) */}
            {messages.length <= 1 && greetingComplete && (
              <div className="px-4 pb-2 flex-shrink-0">
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(undefined, prompt)}
                      className="text-xs px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full hover:bg-violet-100 border border-violet-200/50 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-gray-100 bg-white p-3">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      autoResize(e.target);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Anna anything..."
                    rows={1}
                    className="w-full resize-none border-0 bg-transparent text-sm leading-5 min-h-[24px] p-0 text-gray-800 placeholder:text-gray-400 focus:outline-none"
                    style={{ maxHeight: INPUT_MAX_HEIGHT_PX }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                    input.trim() && !isLoading
                      ? "bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md shadow-violet-200 hover:shadow-lg hover:scale-105"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Powered by NONEAA • AI may produce inaccurate information
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
