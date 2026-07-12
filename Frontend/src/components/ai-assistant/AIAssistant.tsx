import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, MessageCircle, Headset } from 'lucide-react';
import annaAvatar from '@/assets/anna.png';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  startConversation,
  sendVisitorMessage,
  escalateConversation,
  getMessages,
} from '@/lib/api/liveChatApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const GREETING_TEXT = "Hi! I'm Anna, your Virtual AI Assistant for the NONEAA platform. I can help you with anything related to Noneaa platform . What would you like to know?";
const TYPING_SPEED_MS = 25;
const INPUT_MAX_HEIGHT_PX = 120;

const SYSTEM_CONTEXT = `
# IDENTITY
You are Anna, the official Virtual Assistant for the NONEAA Platform.
Your role is to assist school administrators, teachers, parents, students, and website visitors by providing accurate information about the NONEAA platform and the Kenyan Competency Based Education (CBE) system.
You are professional, patient, friendly, knowledgeable, and concise.
Never claim to be human.
Never pretend to have performed actions you cannot perform.
Always be honest.

# YOUR KNOWLEDGE
You specialize in:
- The NONEAA platform
- Kenyan Competency Based Education (CBE)
- CBC curriculum
- School administration
- Assessments
- Learning Areas
- Competencies
- Teachers
- Parents
- Students
- School management
- User accounts
- Reports
- Attendance
- Timetables
- Fees
- Admissions
- Results
- Technical guidance related to NONEAA

# LEADERSHIP TEAM
- John Ominde - CEO & Founder
- Jeremy Bravoge - Director of Technology
- Livingstone Oduor - Full Stack Software Engineer
- Victoria Wamboi - Digital Marketing Lead

# ABOUT NONEAA
NONEAA is an educational platform designed to help schools digitize and simplify school management under the Kenyan Competency Based Education system.
The platform supports student management, teacher management, parent access, CBC assessments, report generation, attendance, school communication, timetables, learning areas, competency tracking, school records, academic progress, and administrative management.
Only mention features that actually exist.

# GREETINGS & CASUAL CONVERSATION
You can respond naturally and friendly to greetings like "hi", "hello", "good morning", "how are you", etc.
Keep responses warm but professional.

# WHEN ANSWERING
Be accurate, concise, and helpful. Use simple English.

# RESPONSE FORMATTING
- Never use asterisks (*) or double asterisks (**).
- Use hyphens (-) or bullet points (•) for lists.
- Use numbered lists for steps.
- Keep answers short unless user asks for details.

# SEARCH CAPABILITY
You have access to search noneaa.com including subpages. Use the search results to give accurate answers.
`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY || '';

console.log("Tavily Key Loaded:", !!TAVILY_API_KEY); // Debug

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
  if (!TAVILY_API_KEY) {
    console.log("Tavily key is missing");
    return "";
  }
  console.log("Searching Tavily for:", query);
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
    console.log("Tavily status:", response.status);
    if (!response.ok) return "";
    const data = await response.json();
    console.log("Tavily results found:", data.results?.length || 0);
    if (!data.results || data.results.length === 0) return "";
    return data.results.map((result: any, index: number) => `
Source ${index + 1}:
Title: ${result.title}
URL: ${result.url}
Content: ${result.content}
`).join('\n---\n');
  } catch (error) {
    console.error("Tavily error:", error);
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
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const greetingStartedRef = useRef(false);
  const greetingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Live chat: conversation persistence + human handoff ──
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isEscalated, setIsEscalated] = useState(false);
  const [agentName, setAgentName] = useState<string | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const lastPolledAtRef = useRef<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Create (or reuse) a conversation as soon as the widget is opened.
  useEffect(() => {
    if (!isOpen || conversationId) return;
    const existingId = sessionStorage.getItem('noneaa_chat_conversation_id');
    if (existingId) {
      setConversationId(existingId);
      return;
    }
    startConversation(window.location.pathname)
      .then((conv) => {
        setConversationId(conv.id);
        sessionStorage.setItem('noneaa_chat_conversation_id', conv.id);
      })
      .catch((err) => console.error('Failed to start live chat conversation:', err));
  }, [isOpen, conversationId]);

  // Poll for agent replies once the conversation has been escalated.
  useEffect(() => {
    if (!isOpen || !isEscalated || !conversationId) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const { messages: newMessages } = await getMessages(conversationId, lastPolledAtRef.current || undefined);
        if (newMessages.length === 0) return;
        lastPolledAtRef.current = newMessages[newMessages.length - 1].created_at;

        const fresh = newMessages.filter(
          (m) => (m.sender_type === 'agent' || m.sender_type === 'system') && !seenMessageIdsRef.current.has(m.id)
        );
        if (fresh.length === 0) return;

        fresh.forEach((m) => seenMessageIdsRef.current.add(m.id));
        if (fresh.some((m) => m.sender_type === 'agent')) {
          const lastAgentMsg = [...fresh].reverse().find((m) => m.sender_type === 'agent');
          if (lastAgentMsg?.sender_name) setAgentName(lastAgentMsg.sender_name);
        }

        setMessages((prev) => [
          ...prev,
          ...fresh.map((m) => ({
            id: m.id,
            role: 'assistant' as const,
            content: m.content,
            timestamp: new Date(m.created_at),
          })),
        ]);
      } catch (err) {
        console.error('Live chat polling error:', err);
      }
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 3500);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, isEscalated, conversationId]);

  const handleTalkToHuman = async () => {
    if (!conversationId || isEscalated) return;
    try {
      await escalateConversation(conversationId);
    } catch (err) {
      console.error('Failed to escalate conversation:', err);
    }
    setIsEscalated(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `escalate-${Date.now()}`,
        role: 'assistant',
        content: "Connecting you to a member of our team. Someone will be with you shortly.",
        timestamp: new Date(),
      },
    ]);
  };

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

    // Always persist the visitor's message so an agent can see full history,
    // and check whether this message should trigger a handoff to a human.
    let justEscalated = false;
    if (conversationId) {
      try {
        const { escalated } = await sendVisitorMessage(conversationId, messageText);
        if (escalated && !isEscalated) {
          justEscalated = true;
          setIsEscalated(true);
        }
      } catch (err) {
        console.error('Failed to persist visitor message:', err);
      }
    }

    // Once escalated, a human is handling replies — stop generating AI replies
    // and just wait on the polling loop above.
    if (isEscalated || justEscalated) {
      if (justEscalated) {
        setMessages(prev => [
          ...prev,
          {
            id: `escalate-${Date.now()}`,
            role: 'assistant',
            content: "Connecting you to a member of our team. Someone will be with you shortly.",
            timestamp: new Date(),
          },
        ]);
      }
      setIsLoading(false);
      return;
    }

    try {
      const searchResults = await searchNoneaaWebsite(messageText);
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const enhancedSystemPrompt = searchResults
        ? `${SYSTEM_CONTEXT}\n\n=== Search Results from noneaa.com ===\n${searchResults}\n\nAnswer based ONLY on the search results above.`
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
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 bg-[#1E3A28] text-white text-sm font-semibold pl-3 pr-4 py-2.5 rounded-full shadow-xl hover:bg-[#173420] transition-colors"
            >
              <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                <img src={annaAvatar} alt="Anna" className="w-full h-full object-cover" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-[#1E3A28]" />
              </div>
              Live Support
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              aria-label="Open chat"
              className="w-11 h-11 rounded-full bg-[#1E3A28] shadow-xl flex items-center justify-center hover:bg-[#173420] transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </motion.button>
          </motion.div>
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
              isDarkMode ? "bg-[#132018] text-[#F6F1E7] border-[#2a3f30]" : "bg-[#F6F1E7] text-[#1C1C1C] border-[#9C7A3C]/30"
            )}
          >
            {/* Header */}
            <div className={cn("px-4 py-3 flex items-center gap-3 border-b",
              isDarkMode ? "bg-[#0d1810] border-[#2a3f30]" : "bg-[#1E3A28] border-[#1E3A28]"
            )}>
              <div className="relative">
                <img src={annaAvatar} alt="Anna" className="w-9 h-9 rounded-full object-cover ring-2 ring-[#9C7A3C]" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#1E3A28]" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">Anna</div>
                <div className="text-xs text-[#E4C68A]">
                  {isEscalated
                    ? agentName
                      ? `Connected to ${agentName}`
                      : 'Connecting you to a team member…'
                    : 'Customer Support • Online'}
                </div>
              </div>
              {!isEscalated && (
                <button
                  onClick={handleTalkToHuman}
                  title="Talk to a human"
                  className="text-[#E4C68A] hover:text-white transition-colors mr-1"
                >
                  <Headset className="w-5 h-5" />
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-3xl text-[#E4C68A] hover:text-white">×</button>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} onScroll={handleScroll} className={cn("flex-1 overflow-y-auto p-4 space-y-5", isDarkMode ? "bg-[#0a140d]" : "bg-[#F6F1E7]")}>
              <div className="flex justify-center">
                <div className={cn("text-xs px-5 py-2 rounded-full", isDarkMode ? "bg-[#1E3A28]/40 text-[#E4C68A]" : "bg-[#9C7A3C]/15 text-[#6b5228]")}>You are now chatting with: Anna</div>
              </div>
              {messages.map((message) => (
                <div key={message.id} className={cn("flex", message.role === 'user' ? "justify-end" : "justify-start")}>
                  {message.role === 'assistant' && (
                    <img src={annaAvatar} alt="Anna" className="w-8 h-8 rounded-full flex-shrink-0 mr-3 mt-1" />
                  )}
                  <div className={cn("max-w-[76%]", message.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-[13px] font-tahoma leading-relaxed",
                      message.role === 'user' ? "bg-[#1E3A28] text-white rounded-br-sm" :
                      isDarkMode ? "bg-[#1a2b20] text-[#F6F1E7] border border-[#2a3f30] rounded-bl-sm" : "bg-white border border-[#9C7A3C]/25 text-[#1C1C1C] rounded-bl-sm"
                    )}>
                      {message.id === '1' && !greetingComplete ? (
                        <span>{greetingText}<span className="animate-pulse">▋</span></span>
                      ) : (
                        <span className="whitespace-pre-wrap">{message.content}</span>
                      )}
                    </div>
                    <div className={cn("text-[10px] mt-1 px-1", isDarkMode ? "text-[#9C7A3C]/70" : "text-[#4A4A44]/60")}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <img src={annaAvatar} alt="Anna" className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
                  <div className={cn("px-4 py-3 rounded-2xl rounded-bl-sm", isDarkMode ? "bg-[#1a2b20] border border-[#2a3f30]" : "bg-white border border-[#9C7A3C]/25")}>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-[#9C7A3C] rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-[#9C7A3C] rounded-full animate-bounce delay-150" />
                      <div className="w-2 h-2 bg-[#9C7A3C] rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={cn("border-t p-4", isDarkMode ? "bg-[#132018] border-[#2a3f30]" : "bg-white border-[#9C7A3C]/20")}>
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
                      ? "bg-[#0d1810] border border-[#2a3f30] focus:border-[#9C7A3C] text-[#F6F1E7]"
                      : "bg-[#F6F1E7] border border-[#9C7A3C]/30 focus:border-[#1E3A28] text-[#1C1C1C]",
                    "rounded-lg"
                  )}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 bg-[#1E3A28] hover:bg-[#173420] disabled:bg-[#9C7A3C]/40 text-white rounded-lg flex items-center justify-center transition-colors"
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
