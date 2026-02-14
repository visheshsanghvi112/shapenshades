import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ChevronRight } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
}

interface QA {
  question: string;
  answer: string;
  keywords?: string[];
}

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
      'Our studio is at 705, Prathvi Sadan, B.P. Road, Bhayandar East, Thane, Maharashtra 401105. Feel free to visit us during working hours!',
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
];

const GREETING: Message = {
  id: 0,
  text: "Hello! 👋 I'm the Shapes & Shades assistant. How can I help you today? Pick a question below or type your own!",
  sender: 'bot',
};

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(1);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, sender: 'bot' | 'user') => {
    const id = nextIdRef.current++;
    setMessages((prev) => [...prev, { id, text, sender }]);
  };

  const findAnswer = (query: string): string => {
    const lower = query.toLowerCase();
    // Try keyword matching
    for (const qa of PREDEFINED_QA) {
      if (qa.keywords?.some((kw) => lower.includes(kw))) {
        return qa.answer;
      }
    }
    // Fallback
    return "Thanks for your question! For detailed information, please contact us at design.shapenshades@gmail.com or call +91 80972 41237. You can also visit our Contact page to send us a message.";
  };

  const handleQuickQuestion = (qa: QA) => {
    addMessage(qa.question, 'user');
    setShowQuickQuestions(false);
    setTimeout(() => {
      addMessage(qa.answer, 'bot');
      // Show quick questions again after the answer
      setTimeout(() => setShowQuickQuestions(true), 500);
    }, 600);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addMessage(trimmed, 'user');
    setInput('');
    setShowQuickQuestions(false);
    setTimeout(() => {
      addMessage(findAnswer(trimmed), 'bot');
      setTimeout(() => setShowQuickQuestions(true), 500);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Bubble */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-800 rotate-90 scale-90'
            : 'bg-black hover:bg-gray-800 scale-100 animate-bounce-slow'
        }`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-black text-white px-5 py-4 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Shapes & Shades</p>
              <p className="text-xs text-gray-300">Ask us anything</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-black text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Quick Questions */}
            {showQuickQuestions && (
              <div className="space-y-1.5 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
                  Quick Questions
                </p>
                {PREDEFINED_QA.map((qa, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(qa)}
                    className="w-full text-left px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-all flex items-center gap-2 group"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-black shrink-0 transition-colors" />
                    <span className="text-gray-600 group-hover:text-black transition-colors">
                      {qa.question}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 px-3 py-3 bg-white flex gap-2 items-end shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              className="flex-1 text-sm px-3 py-2.5 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-black/10 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2.5 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
