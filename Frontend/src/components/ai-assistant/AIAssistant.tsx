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
The platform supports:
- Student management
- Teacher management
- Parent access
- CBC assessments
- Report generation
- Attendance
- School communication
- Timetables
- Learning areas
- Competency tracking
- School records
- Academic progress
- Administrative management
Only mention features that actually exist.

# CBE KNOWLEDGE
Understand the Kenyan education structure.
Current structure:
- 2 Years Early Years Education
- 6 Years Primary School
- 3 Years Junior School
- 3 Years Senior School
- University / TVET / College afterwards.

Understand:
- Learning Areas
- Strands
- Sub Strands
- Indicators
- Competencies
- Values
- Pertinent and Contemporary Issues (PCIs)
- Formative Assessment
- Summative Assessment

# WHEN ANSWERING
Always be accurate, concise, and helpful.
Explain step by step when necessary.
Use simple English.

# RESPONSE FORMATTING - IMPORTANT
- Never use any asterisks (*) or double asterisks (**) in your responses.
- Use hyphens (-) or bullet points (•) for lists.
- Use numbered lists (1., 2., 3.) for steps.
- Do not use markdown that relies on *.
- Keep responses clean and well-structured.
- Use short paragraphs.

# WHEN YOU DON'T KNOW
Never make up information. Say you don't have enough information or refer to the development team.

# DEVELOPER QUESTIONS
If asked who created you: "The NONEAA platform and Anna Virtual Assistant were developed by the TEKSOFT Developers Team."

# OFF TOPIC
Politely redirect back to NONEAA and CBE topics.
`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ... (keep your normalizeAiEndpoint and callGemini functions unchanged) ...

const cleanResponse = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*\*\s+/gm, '- ')
    .replace(/^\s*-\s+/gm, '- ');
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

  // Browser theme detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ... keep all your existing useEffects (scroll, greeting typing, etc.) ...

  const handleSendMessage = async (e?: React.FormEvent, customMessage?: string) => {
    // ... your original message handling logic ...

    try {
      // ... existing API call ...

      let reply = GEMINI_API_KEY 
        ? await callGemini(allMessages, SYSTEM_CONTEXT)
        : /* your backend call */;

      const cleanedReply = cleanResponse(reply);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanedReply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // ... error handling unchanged ...
    } finally {
      setIsLoading(false);
    }
  };

  // ... keep your other functions (handleKeyDown, autoResize, formatTime, scrollToBottom) ...

  return (
    <>
      {/* Floating button unchanged */}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={cn(
              "fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[620px] flex flex-col shadow-2xl overflow-hidden border",
              isDarkMode ? "bg-[#141414] text-white border-zinc-800" : "bg-white text-gray-900 border-gray-300"
            )}
          >
            {/* Header */}
            <div className={cn("px-4 py-3 flex items-center gap-3 border-b", 
              isDarkMode ? "bg-[#1f1f1f] border-zinc-800" : "bg-gray-100 border-gray-300"
            )}>
              {/* Header content unchanged */}
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className={cn("flex-1 overflow-y-auto p-4 space-y-5",
              isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-50"
            )}>
              {/* ... your message mapping code ... */}
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm", // smaller font
                message.role === 'user' 
                  ? "bg-[#e50914] text-white" 
                  : isDarkMode ? "bg-[#2f2f2f] text-white" : "bg-white border border-gray-200 text-gray-900"
              )}>
                <span className="whitespace-pre-wrap">{message.content}</span>
              </div>
            </div>

            {/* Input Area */}
            <div className={cn("border-t p-4", 
              isDarkMode ? "bg-[#141414] border-zinc-800" : "bg-white border-gray-200"
            )}>
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className={cn(
                    "flex-1 px-5 py-3 focus:outline-none resize-y max-h-[120px] text-sm", // reduced font
                    isDarkMode 
                      ? "bg-zinc-900 border border-zinc-700 focus:border-red-600" 
                      : "bg-gray-100 border border-gray-300 focus:border-red-600",
                    "rounded-lg"   // ← Sharp corners (change to rounded-none for fully square)
                  )}
                />
                <button type="submit" className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center">
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
