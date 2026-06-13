import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import jarvisLogo from '@/assets/jarvis.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const GREETING_TEXT = 'Hi there 👋! My name is Jarvis, your online Assistant. Ask me anything you need to know about our platform!';
const PANEL_WIDTH = 380;
const PANEL_HEIGHT_FALLBACK = 500;
const GREETING_CHARS = Array.from(GREETING_TEXT);
const TYPING_SPEED_MS = 30;
const INPUT_MAX_HEIGHT_PX = 120;

const SYSTEM_CONTEXT = `You are a helpful AI assistant for the Nonea CBE Education Platform. You strictly answer questions related to:
1. The Kenyan Competency-Based Education (CBE) system
2. The Nonea platform features and functionality
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
- Assessment is continuous and formative, focusing on competency development`;

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
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: GREETING_TEXT
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [greetingText, setGreetingText] = useState('');
  const [greetingComplete, setGreetingComplete] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greetingStartedRef = useRef(false);
  const greetingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTypingIndicator]);

  useEffect(() => {
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Add delay before showing typing indicator to make it feel like a transition
    if (isLoading) {
      typingTimeoutRef.current = setTimeout(() => {
        setShowTypingIndicator(true);
      }, 600); // 600ms delay before showing the typing indicator
    } else {
      setShowTypingIndicator(false);
      // Refocus the input once AI finishes responding
      inputRef.current?.focus();
    }

    // Cleanup timeout on unmount or when isLoading changes
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    if (isOpen && !greetingStartedRef.current) {
      greetingStartedRef.current = true;
      let charIndex = 0;
      const typeNextChar = () => {
        charIndex += 1;
        setGreetingText(GREETING_CHARS.slice(0, charIndex).join(''));
        if (charIndex < GREETING_CHARS.length) {
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
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleDragMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag on primary mouse button
    if (e.button !== 0) return;
    e.preventDefault();
    const rect = chatWindowRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const panelW = chatWindowRef.current?.offsetWidth ?? PANEL_WIDTH;
      const panelH = chatWindowRef.current?.offsetHeight ?? PANEL_HEIGHT_FALLBACK;
      const newX = Math.min(Math.max(0, e.clientX - dragOffsetRef.current.x), winW - panelW);
      const newY = Math.min(Math.max(0, e.clientY - dragOffsetRef.current.y), winH - panelH);
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

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
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Assistant is currently offline. Please contact our team directly if you have any queries.',
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

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "hover:scale-110 active:scale-95",
          isOpen && "rotate-90"
        )}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <img src={jarvisLogo} alt="Jarvis" className="w-10 h-10 object-cover rounded-full" />
        )}
      </button>

      {/* Chat Window */}
      <div
        ref={chatWindowRef}
        style={position ? { left: position.x, top: position.y, bottom: 'auto', right: 'auto' } : undefined}
        className={cn(
          "fixed z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-card border border-border shadow-2xl overflow-hidden",
          "transition-[opacity,transform] duration-300",
          !position && "bottom-24 right-6",
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none",
          isDragging && "select-none"
        )}
      >
        {/* Header — drag handle */}
        <div
          onMouseDown={handleDragMouseDown}
          className="bg-primary text-primary-foreground p-4 flex items-center gap-3 cursor-move"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            <img src={jarvisLogo} alt="Jarvis" className="w-10 h-10 object-cover rounded-full" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Jarvis</h3>
            <p className="text-xs text-primary-foreground/70">online</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="h-[350px] overflow-y-auto p-4 space-y-4 bg-background">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <img src={jarvisLogo} alt="Jarvis" className="w-full h-full object-cover" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                {message.id === '1' && !greetingComplete ? (
                  <span>
                    {greetingText}
                    <span className="inline-block w-0.5 h-3.5 bg-current ml-0.5 align-middle animate-pulse" aria-hidden="true" />
                  </span>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          {showTypingIndicator && (
            <div className="flex gap-2 justify-start" role="status" aria-label="AI is typing a response">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <img src={jarvisLogo} alt="Jarvis" className="w-full h-full object-cover" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <span className="text-sm text-muted-foreground inline-flex gap-1">
                  typing
                  <span className="inline-flex gap-0.5" aria-hidden="true">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card">
          <div className="flex items-end gap-2 bg-background border border-border rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize(e.target);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about CBE... (Shift+Enter for new line)"
              rows={1}
              className="flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-5 min-h-[36px] p-0 py-1 placeholder:text-muted-foreground/60"
              style={{ maxHeight: INPUT_MAX_HEIGHT_PX }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-8 w-8 rounded-xl flex-shrink-0 mb-0.5"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Powered by Teksoft Team
          </p>
        </form>
      </div>
    </>
  );
}
