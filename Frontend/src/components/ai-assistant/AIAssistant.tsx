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

# ABOUT NONEAA
NONEAA is an educational platform designed to help schools digitize and simplify school management under the Kenyan Competency Based Education system.
The platform supports student management, teacher management, parent access, CBC assessments, report generation, attendance, school communication, timetables, learning areas, competency tracking, school records, academic progress, and administrative management.
Only mention features that actually exist.

# CBE KNOWLEDGE
Understand the Kenyan education structure and key terms (Learning Areas, Strands, Sub Strands, etc.).

# WHEN ANSWERING
Be accurate, concise, and helpful. Use simple English.

# RESPONSE FORMATTING
- Never use asterisks (*) or double asterisks (**).
- Use hyphens (-) or bullet points (•) for lists.
- Use numbered lists for steps.
- Keep answers short unless user asks for details.

# NEW: SEARCH CAPABILITY
You have access to search noneaa.com. Use the search results to give accurate, up-to-date answers.
`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY || '';   // ← Add this in .env

async function searchNoneaaWebsite(query: string): Promise<string> {
  if (!TAVILY_API_KEY) return "";

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `${query} site:noneaa.com`,
        search_depth: "basic",
        include_answer: true,
        max_results: 6,
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

  // Theme detection
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

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  // Greeting typing effect (unchanged)
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
      // Perform search on noneaa.com
      const searchResults = await searchNoneaaWebsite(messageText);

      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const enhancedSystemPrompt = searchResults 
        ? `${SYSTEM_CONTEXT}\n\n=== Search Results from noneaa.com ===\n${searchResults}\n\nUse the above information to answer accurately.`
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

  // Keep your existing helper functions: handleKeyDown, autoResize, formatTime, callGemini, etc.

  // ... (rest of the return JSX remains exactly the same as previous version) ...

  return (
    // ... your full return JSX (same as last version with Tahoma font and square input) ...
  );
}
