import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send } from 'lucide-react';
import annaAvatar from '@/assets/anna.png';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const GREETING_TEXT = "Hi! I'm Anna, your Virtual AI Assistant for the NONEAA platform. I can help you with anything related to Noneaa platform . What would you like to know?";
const TYPING_SPEED_MS = 25;
const INPUT_MAX_HEIGHT_PX = 120;

const QUICK_PROMPTS = [
  'What is CBE?',
  'How does assessment work?',
  'Tell me about NONEAA',
  'CBC structure explained',
];

const SYSTEM_CONTEXT = `
# IDENTITY
You are Anna, the official Virtual AI Assistant for the NONEAA Platform.
Your role is to assist users with accurate information.

# CRITICAL RULES
- NEVER make up information.
- If the search results do not contain the answer, say: "I couldn't find that information on the official website."
- Be honest and direct.

# SEARCH USAGE
You have access to search noneaa.com. Use the provided search results for company-related questions.

# RESPONSE STYLE
- Keep replies short.
- Never use asterisks (*).
- Use - for lists.
`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY || '';

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

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
}

async function searchNoneaaWebsite(query: string): Promise<string> {
  if (!TAVILY_API_KEY) return "";
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `${query} site:noneaa.com`,
        search_depth: "advanced",
        include_answer: true,
        max_results: 8,
      }),
    });

    if (!response.ok) return "";
    const data = await response.json();

    if (!data.results || data.results.length === 0) return "";

    return data.results.map((result: any, index: number) => `
Source ${index + 1}:
Title: ${result.title}
URL: ${result.url}
Content: ${result.content}
`).join('\n---\n');
  } catch (error) {
    console.error("Tavily search error:", error);
    return "";
  }
}

const cleanResponse = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*\*\s+/gm, '- ')
    .trim();
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: GREETING_TEXT, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [greetingText, setGreetingText] = useState('');
  const [greetingComplete, setGreetingComplete] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const greetingStartedRef = useRef(false);
  const greetingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Greeting Typing Effect
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
      if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);
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

    try {
      const searchResults = await searchNoneaaWebsite(messageText);

      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const enhancedSystemPrompt = searchResults 
        ? `${SYSTEM_CONTEXT}\n\n=== Search Results from noneaa.com ===\n${searchResults}\n\nAnswer based ONLY on the search results above. Do not guess.`
        : SYSTEM_CONTEXT;

      let reply: string;
      if (GEMINI_API_KEY) {
        reply = await callGemini(allMessages, enhancedSystemPrompt);
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
            systemPrompt: enhancedSystemPrompt,
          }),
        });
        if (!response.ok) throw new Error('ASSISTANT_OFFLINE');
        const data = await response.json();
        reply = data?.data?.reply || data?.message || data?.content || 'I apologize, but I encountered an issue.';
      }

      const cleanedReply = cleanResponse(reply);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanedReply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m having trouble connecting right now. Please try again or contact contact@noneaa.com.',
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
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="relative w-14 h-14 rounded-full overflow-hidden ring-4 ring-red-600/30 shadow-xl">
              <img src={annaAvatar} alt="Anna" className="w-full h-full object-cover" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[620px] flex flex-col shadow-2xl overflow-hidden border",
              isDarkMode ? "bg-[#141414] text-white border-zinc-800" : "bg-white text-gray-900 border-gray-300"
            )}
          >
            {/* Header */}
            <div className={cn("px-4 py-3 flex items-center gap-3 border-b", 
              isDarkMode ? "bg-[#1f1f1f] border-zinc-800" : "bg-gray-100 border-gray-300"
            )}>
              <div className="relative">
                <img src={annaAvatar} alt="Anna" className="w-9 h-9 rounded-full object-cover ring-2 ring-red-600" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#1f1f1f]" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Anna - AI Assistant</div>
                <div className="text-xs text-zinc-400">Customer Support • Online</div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-3xl text-zinc-400 hover:text-white">×</button>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} onScroll={handleScroll} className={cn("flex-1 overflow-y-auto p-4 space-y-5", isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-50")}>
              <div className="flex justify-center">
                <div className="bg-zinc-800 text-zinc-400 text-xs px-5 py-2 rounded-full">You are now chatting with: Anna</div>
              </div>

              {messages.map((message) => (
                <div key={message.id} className={cn("flex", message.role === 'user' ? "justify-end" : "justify-start")}>
                  {message.role === 'assistant' && (
                    <img src={annaAvatar} alt="Anna" className="w-8 h-8 rounded-full flex-shrink-0 mr-3 mt-1" />
                  )}
                  <div className={cn("max-w-[76%]", message.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-[13px] font-tahoma leading-relaxed",
                      message.role === 'user' ? "bg-[#e50914] text-white rounded-br-sm" : 
                      isDarkMode ? "bg-[#2f2f2f] text-white rounded-bl-sm" : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                    )}>
                      {message.id === '1' && !greetingComplete ? (
                        <span>{greetingText}<span className="animate-pulse">▋</span></span>
                      ) : (
                        <span className="whitespace-pre-wrap">{message.content}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1 px-1">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0 ml-3 mt-1 flex items-center justify-center text-sm">👤</div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <img src={annaAvatar} alt="Anna" className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
                  <div className="bg-[#2f2f2f] px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-150" />
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={cn("border-t p-4", isDarkMode ? "bg-[#141414] border-zinc-800" : "bg-white border-gray-200")}>
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className={cn(
                    "flex-1 px-5 py-3 focus:outline-none resize-y max-h-[120px] text-[13px] font-tahoma",
                    isDarkMode 
                      ? "bg-zinc-900 border border-zinc-700 focus:border-red-600 text-white" 
                      : "bg-gray-100 border border-gray-300 focus:border-red-600 text-gray-900",
                    "rounded-none"
                  )}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 rounded-lg flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
