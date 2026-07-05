import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const SYSTEM_PROMPT = `You are "Solora Guide", the friendly AI assistant for Solora StayCo — a premium mood-based staycation booking platform in the Philippines. 
Your job is to help users discover the perfect staycation by understanding their mood. 
The available mood categories are: Relaxed, Romantic, Adventurous, Need Peace, Creative, Family Time, Self-Care, and Solo Recharge.
Keep responses short (2-4 sentences max), warm, and conversational. Use emojis sparingly. Never use markdown formatting.
If asked about pricing or bookings, guide users to explore listings on the platform.`;

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hi there! ✨ I'm your Solora StayCo assistant. How can I help you find the perfect staycation today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!GEMINI_KEY) {
      setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'model', content: "⚠️ The Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file and restart the dev server." }]);
      setInput('');
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Build conversation history for context
      const conversationHistory = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const fullPrompt = `${SYSTEM_PROMPT}\n\nConversation so far:\n${conversationHistory}\nUser: ${userMsg}\nAssistant:`;

      // Retry logic for rate limits
      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await model.generateContent(fullPrompt);
          const responseText = result.response.text();
          setMessages(prev => [...prev, { role: 'model', content: responseText }]);
          lastError = null;
          break;
        } catch (retryErr) {
          lastError = retryErr;
          if (retryErr.message?.includes('429') || retryErr.message?.includes('quota')) {
            // Wait before retrying: 3s, 6s, 12s
            await new Promise(r => setTimeout(r, 3000 * Math.pow(2, attempt)));
          } else {
            throw retryErr; // Non-retryable error
          }
        }
      }

      if (lastError) throw lastError;
    } catch (error) {
      console.error("Chat error:", error);
      let errorMsg = "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        errorMsg = "The AI service quota is currently at its limit. Please wait a minute and try again, or check that the Generative Language API is enabled in your Google Cloud Console. 😊";
      } else if (error.message?.includes('API key') || error.message?.includes('403')) {
        errorMsg = "⚠️ There seems to be an issue with the API key. Please verify your VITE_GEMINI_API_KEY in .env and restart the dev server.";
      } else if (error.message?.includes('not found') || error.message?.includes('404')) {
        errorMsg = "⚠️ The AI model is temporarily unavailable. Please try again later.";
      }
      setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-large flex items-center justify-center hover:scale-105 transition-transform duration-300 z-50"
        aria-label="Open Chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-card border border-border shadow-large rounded-2xl flex flex-col overflow-hidden z-50 animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-4 text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl shadow-inner backdrop-blur-sm">
              ✨
            </div>
            <div>
              <h3 className="font-serif font-semibold text-lg">Solora Guide</h3>
              <p className="text-white/80 text-xs">Powered by Gemini AI</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-card border border-border text-foreground rounded-bl-sm shadow-soft'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-soft flex gap-1.5 items-center h-10">
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-border bg-card">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about moods, or say hi..."
                className="w-full bg-muted/30 border border-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 text-primary hover:bg-primary/10 rounded-xl disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                aria-label="Send"
              >
                <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
