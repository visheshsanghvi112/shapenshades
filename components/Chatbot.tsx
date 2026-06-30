import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ChevronRight, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  isTyped?: boolean;
}

interface QA {
  question: string;
  answer: string;
  keywords?: string[];
}

// Typewriter Component for Realtime effect
// Typewriter Component Wrapper - Simplified to prevent race conditions
const Typewriter: React.FC<{ text: string; onComplete?: () => void }> = ({ text, onComplete }) => {
  // Use a simple timeout to trigger onComplete if needed, but render text immediately
  useEffect(() => {
    if (onComplete) {
      // Small delay just to allow DOM to settle
      const timer = setTimeout(onComplete, 100);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  return <>{text}</>;
};

const PREDEFINED_QA: QA[] = [
  {
    question: 'What services do you offer?',
    answer:
      'We offer comprehensive interior design, architecture, and space planning services. This includes residential interiors, commercial fit-outs, renovation & remodeling, turnkey project execution, 3D visualization, and vastu-compliant designs.',
    keywords: ['service', 'offer', 'do', 'provide', 'work'],
  },
  {
    question: 'Where is your office located?',
    answer:
      'Our studio is at 705, Prathvi Sadan, B.P. Road, Bhayandar East, Mumbai, Maharashtra 401105. Feel free to visit us during working hours!',
    keywords: ['location', 'address', 'office', 'studio', 'where', 'visit', 'find'],
  },
  {
    question: 'What are your working hours?',
    answer:
      'We are available Monday to Saturday, 10:00 AM to 7:00 PM. You can also reach us via phone or email outside these hours for urgent queries.',
    keywords: ['hour', 'time', 'open', 'when', 'schedule', 'available', 'timing'],
  },
  {
    question: 'How can I contact you?',
    answer:
      'You can reach us by phone at +91 80972 41237 or email us at design.shapenshades@gmail.com. You can also fill out the contact form on our Contact page.',
    keywords: ['contact', 'phone', 'email', 'call', 'reach', 'number'],
  },
  {
    question: 'How much do your services cost?',
    answer:
      'Our pricing depends on the scope, size, and complexity of the project. We offer customized quotes after an initial consultation. Reach out to us for a free consultation and estimate!',
    keywords: ['cost', 'price', 'rate', 'charge', 'fee', 'budget', 'much', 'expensive', 'affordable'],
  },
  {
    question: 'Do you take residential projects?',
    answer:
      'Absolutely! We specialize in residential interior design — from compact apartments to luxury villas. We handle everything from concept to completion.',
    keywords: ['residential', 'home', 'house', 'flat', 'apartment', 'villa', 'bungalow'],
  },
  {
    question: 'Do you handle commercial projects?',
    answer:
      'Yes, we design commercial spaces including offices, retail stores, restaurants, and showrooms. We focus on creating functional yet aesthetically striking environments.',
    keywords: ['commercial', 'office', 'shop', 'restaurant', 'store', 'showroom', 'retail'],
  },
  {
    question: 'How long does a project take?',
    answer:
      'Timelines vary by project size. A typical residential project takes 6–12 weeks from design to execution. Commercial projects may take longer depending on scale. We always share a detailed timeline upfront.',
    keywords: ['long', 'duration', 'timeline', 'time', 'weeks', 'months', 'days', 'complete', 'finish'],
  },
  {
    question: 'Can I see your past work?',
    answer:
      'Of course! Visit our Projects page to browse our portfolio of completed residential and commercial projects. Each project showcases our design philosophy and attention to detail.',
    keywords: ['portfolio', 'past', 'previous', 'work', 'project', 'see', 'show', 'gallery', 'photo'],
  },
  {
    question: 'Do you provide 3D designs?',
    answer:
      'Yes, we provide detailed 3D visualizations and walkthroughs so you can experience your space before execution begins. This helps in making informed decisions on layout, colors, and materials.',
    keywords: ['3d', 'render', 'visual', 'walkthrough', 'model', 'design', 'preview'],
  },
  // --- CONVERSATIONAL / CHIT-CHAT ---
  {
    question: 'Hello',
    answer: 'Hi there! 👋 How can I help you design your dream space today?',
    keywords: ['hi', 'hello', 'hey', 'greetings', 'morning', 'afternoon', 'evening', 'yo', 'sup'],
  },
  {
    question: 'How are you?',
    answer: 'I\'m doing great, thanks for asking! Just busy admiring some beautiful architectural layouts. How are you doing?',
    keywords: ['how are you', 'how are u', 'how r u', 'how do you do', 'whats up'],
  },
  {
    question: 'Who are you?',
    answer: 'I\'m the Shape N Shades virtual assistant. I\'m here to help you navigate our services and answer any questions you might have about design!',
    keywords: ['who are you', 'what are you', 'your name'],
  },
  {
    question: 'Thank you',
    answer: 'You\'re very welcome! Let me know if you need anything else.',
    keywords: ['thank', 'thx', 'thanks', 'appreciate', 'cool', 'great'],
  },
  {
    question: 'Bye',
    answer: 'Goodbye! Feel free to come back if you have more questions. Have a creative day! ✨',
    keywords: ['bye', 'goodbye', 'cya', 'later', 'leave'],
  },
  {
    question: 'Rude',
    answer: 'I\'m just a bot trying my best! If you need specific help, please ask, or you can contact our human team directly at +91 80972 41237.',
    keywords: ['fuck', 'shit', 'stupid', 'dumb', 'idiot', 'shut up', 'bitch', 'ass', 'sex'],
  },
  {
    question: 'Good choice',
    answer: 'Glad you think so! Excellent design is all about making the right choices. 😉',
    keywords: ['good', 'nice', 'awesome', 'amazing', 'wow', 'beautiful'],
  },
  {
    question: 'Joke',
    answer: 'Why did the architect dip his blueprints in the ocean? ... He wanted to see his plans at sea! 🌊🏗️',
    keywords: ['joke', 'funny', 'laugh'],
  },
];

const GREETING: Message = {
  id: 0,
  text: "Hello! 👋 Welcome to Shape N Shades. I'm here to help you with any questions about our design services. Pick a topic below or type your own!",
  sender: 'bot',
  timestamp: new Date(),
  isTyped: true // Greeting acts as already typed
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const TypingIndicator: React.FC = () => (
  <div className="flex justify-start">
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-chatbot-dot-1"></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-chatbot-dot-2"></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-chatbot-dot-3"></span>
        </div>
      </div>
    </div>
  </div>
);

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextIdRef = useRef(1);

  // Auto-scroll when messages update or typing status changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 400);
      // OPTIONAL: If you want to RESET the chat every time they open it:
      // setMessages([GREETING]);
      // BUT usually users like history. 
      // The user asked "When we RELOAD the chats should auto refresh".
      // A page reload ALREADY refreshes the chat.
      // If they mean "Refresh the page -> Chat is gone", that is default behavior.
    }
  }, [isOpen]);

  const addMessage = (text: string, sender: 'bot' | 'user', isTyped: boolean = true) => {
    const id = nextIdRef.current++;
    setMessages((prev) => [...prev, { id, text, sender, timestamp: new Date(), isTyped }]);
  };

  const markMessageAsTyped = (id: number) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, isTyped: true } : msg));
  };


  const findAnswer = (query: string): string => {
    const lower = query.toLowerCase();
    for (const qa of PREDEFINED_QA) {
      if (qa.keywords?.some((kw) => lower.includes(kw))) {
        return qa.answer;
      }
    }
    return "Thanks for your question! For detailed information, please contact us at design.shapenshades@gmail.com or call +91 80972 41237. You can also visit our Contact page to send us a message.";
  };

  const handleBotReply = (answer: string) => {
    setIsTyping(true);
    setShowQuickQuestions(false);

    // Simulate "Thinking" time
    setTimeout(() => {
      setIsTyping(false);
      // Add message but mark isTyped = false to trigger animation
      addMessage(answer, 'bot', false);

      // Re-enable suggestions after typing is roughly done (optional, or rely on Typewriter onComplete)
      // Actually, let's enable suggestions immediately after typing STARTS so they are ready
      setTimeout(() => setShowQuickQuestions(true), 1000);
    }, 1000 + Math.random() * 500);
  };

  const handleQuickQuestion = (qa: QA) => {
    addMessage(qa.question, 'user');
    handleBotReply(qa.answer);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addMessage(trimmed, 'user');
    setInput('');
    handleBotReply(findAnswer(trimmed));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 250);
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* Floating Chat Bubble */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 group ${isOpen
          ? 'bg-gray-700 shadow-gray-300/50'
          : 'bg-gradient-to-br from-gray-900 to-black hover:shadow-xl hover:shadow-black/20 hover:scale-110 animate-bounce-slow'
          }`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white transition-transform duration-300 rotate-0 group-hover:rotate-90" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            {/* Notification dot */}
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></span>
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-36 right-6 z-50 w-[370px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-10rem)] bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 flex flex-col overflow-hidden ${isClosing ? 'animate-chatbot-close' : 'animate-chatbot-open'
            }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white px-5 py-4 flex items-center justify-between shrink-0 relative overflow-hidden">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)'
            }}></div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm tracking-wide">Shape N Shades</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-[11px] text-gray-300">Online now</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleToggle}
              aria-label="Close chat window"
              className="relative z-10 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-300 hover:text-white transition-colors" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-gray-50 to-white chatbot-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-chatbot-msg`}
              >
                {msg.sender === 'bot' && (
                  <div className="flex items-end gap-2 max-w-[85%]">
                    {/* Bot Icon */}
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shrink-0 mb-5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <div className="bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 text-[13px] leading-relaxed shadow-sm min-h-[46px]">
                        {msg.isTyped ? (
                          msg.text
                        ) : (
                          <Typewriter
                            text={msg.text}
                            onComplete={() => markMessageAsTyped(msg.id)}
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 ml-1">{formatTime(msg.timestamp)}</p>
                    </div>
                  </div>
                )}
                {msg.sender === 'user' && (
                  <div className="max-w-[80%]">
                    <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl rounded-br-md px-4 py-3 text-[13px] leading-relaxed shadow-md">
                      {msg.text}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-right mr-1">{formatTime(msg.timestamp)}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && <TypingIndicator />}

            {/* Quick Questions */}
            {showQuickQuestions && !isTyping && (
              <div className="space-y-2 pt-3 pb-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 px-1 flex items-center gap-1.5">
                  <span className="w-4 h-px bg-gray-300"></span>
                  Suggested
                  <span className="w-4 h-px bg-gray-300"></span>
                </p>
                <div className="space-y-1.5">
                  {PREDEFINED_QA.slice(0, 3).map((qa, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickQuestion(qa)}
                      className="w-full text-left px-3.5 py-2.5 text-xs bg-white border border-gray-100 rounded-xl hover:border-gray-900 hover:shadow-sm transition-all flex items-center gap-2.5 group"
                    >
                      <span className="w-5 h-5 rounded-full bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center shrink-0 transition-colors">
                        <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" />
                      </span>
                      <span className="text-gray-600 group-hover:text-gray-900 transition-colors line-clamp-1">
                        {qa.question}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 px-4 py-3 bg-white flex gap-2 items-center shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.03)]">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              className="flex-1 text-sm px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-gray-300 focus:bg-white focus:shadow-sm transition-all placeholder:text-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="Send message"
              className={`p-2.5 rounded-xl shrink-0 transition-all duration-200 ${input.trim()
                ? 'bg-gradient-to-br from-gray-900 to-black text-white shadow-md hover:shadow-lg hover:scale-105'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Powered-by footer */}
          <div className="bg-gray-50 border-t border-gray-100 py-1.5 text-center shrink-0">
            <p className="text-[9px] text-gray-400 tracking-wider uppercase">Shape N Shades • Design Studio</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
