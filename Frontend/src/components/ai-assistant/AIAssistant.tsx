import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const GREETING_TEXT = 'Hi there 👋! My name is Jarvis, your online Assistant. Ask me anything you need to know about our platform!';
const GREETING_CHARS = Array.from(GREETING_TEXT);
const TYPING_SPEED_MS = 30;

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

// Configure your backend API endpoint via environment variable
// Set VITE_AI_API_ENDPOINT in your .env file
// Use relative path so requests are proxied through Vercel (avoids CORS on custom domains)
const AI_API_ENDPOINT = import.meta.env.VITE_AI_API_ENDPOINT || 
  (import.meta.env.PROD ? '/api/ai/ai-chat' : 'http://localhost:3001/api/ai/ai-chat');

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
      // Option 1: Connect to your own backend
      const response = await fetch(AI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          systemPrompt: SYSTEM_CONTEXT
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.content || 'I apologize, but I encountered an issue. Please try again.'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      // Fallback response when backend is not configured
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Assistant is currently offline, please contact our team directly if you have any queries. In the meantime, feel free to explore the platform or check our documentation for information about this platform.'
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
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
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-card border border-border rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden",
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            <img src="/Noneea-logo.jpg" alt="CBE" className="w-8 h-8 object-cover rounded-full" />
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
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
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
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
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
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about CBE..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by Teksoft Team • CBE Educational Platform queries
          </p>
        </form>
      </div>
    </>
  );
}
