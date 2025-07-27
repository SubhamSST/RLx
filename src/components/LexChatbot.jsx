import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'; // You'll need to install this

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- FIX 1: Extracting static instructions from the send function ---
// This is more efficient and the correct way to provide system-level instructions to the model.
const systemInstruction = {
  role: 'system',
  parts: [{
    text: `You are Lex, a friendly and professional financial calculator assistant. Your ONLY job is to suggest the most appropriate calculator(s) from the provided list based on the user's query.

    Your rules are absolute:
    1.  Strictly recommend calculators ONLY from this list.
    2.  If a user asks anything unrelated to choosing a calculator (like financial advice, stock prices, or personal questions), you MUST politely decline and steer the conversation back to their calculator needs. Example refusal: "My expertise is focused on helping you find the right financial calculator. How can I assist you with that today?"
    3.  Keep your responses concise, clear, and focused.
    4.  Briefly explain *why* a calculator is a good fit for their query.
    5.  Use markdown for formatting, especially for lists and bolding key terms.
    
    List of Available Calculators:
    - SIP Calculator: For planning systematic investment plans.
    - EMI Calculator: For calculating loan installments.
    - Lumpsum Calculator: For projecting the future value of a one-time investment.
    - Retirement Corpus Calculator: For planning retirement savings.
    - Loan Affordability: To determine how much loan a person can afford.
    - Sustainable SWP Calculator: For planning systematic withdrawals from investments.
    - Rent vs Buy Calculator: Compares renting vs buying a home.
    - Monthly Expenses Calculator: To track and calculate monthly spending.
    - Fuel Cost Calculator: Calculates fuel cost for a trip.
    - Electricity Bill Estimator: Estimates the monthly electricity bill.
    - Geo-Property Predictor: Predicts future property value based on location.
    - Loan Prediction: Predicts loan approval chances.`
  }]
};


const LexChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();

  // --- FIX 3: Auto-growing textarea ---
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getFallbackSuggestion = (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('investment') || lowerQuery.includes('invest')) {
      return "It seems I'm having trouble connecting. For investments, you might like the **SIP Calculator** for monthly plans or the **Lumpsum Calculator** for one-time investments.";
    }
    if (lowerQuery.includes('loan') || lowerQuery.includes('emi')) {
      return "It seems I'm having trouble connecting. For loans, check out the **EMI Calculator**, **Loan Affordability Calculator**, or our **Loan Prediction** tool.";
    }
    // A generic but helpful fallback
    return "I'm having connection issues, but here are our most popular calculators:\n\n* **SIP Calculator** - For investments\n* **EMI Calculator** - For loans\n* **Retirement Corpus Calculator** - For retirement planning\n\nWhat type of financial planning interests you most?";
  };

  const handleChat = () => {
    if (!isSignedIn) {
      alert('Please sign in to chat with Lex, your financial assistant!');
      navigate('/signin');
      return;
    }
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([{
        type: 'bot',
        content: `Hi ${user?.firstName || 'there'}! I'm Lex. I can help you find the perfect calculator for your needs. What financial goal are you trying to achieve today?`
      }]);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { type: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // --- FIX 2: Correctly formatting the API request ---
    const history = messages.map(msg => ({
      role: msg.type === 'bot' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [...history, { role: 'user', parts: [{ text: currentInput }] }],
          systemInstruction: systemInstruction,
        })
      });

      if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that. Could you rephrase your need?";
      setMessages(prev => [...prev, { type: 'bot', content: botResponse }]);

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const fallbackResponse = getFallbackSuggestion(currentInput);
      setMessages(prev => [...prev, { type: 'bot', content: fallbackResponse }]);
    }

    setIsLoading(false);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative">
      <button onClick={handleChat} className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3 font-serif">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        Talk with Lex
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl w-full max-w-md h-[90vh] max-h-[700px] flex flex-col shadow-2xl">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black p-4 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black bg-opacity-20 rounded-full flex items-center justify-center"><span className="text-lg font-bold">L</span></div>
                <div>
                  <h3 className="font-bold">Lex</h3>
                  <p className="text-sm opacity-90">Financial Calculator Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-black hover:bg-black hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-medium chat-container">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl markdown-content ${message.type === 'user' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-br-sm font-semibold' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-sm">
                    <div className="flex space-x-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., 'I want to plan for retirement'"
                  className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500 font-medium max-h-24 overflow-y-auto"
                  rows="1"
                  disabled={isLoading}
                />
                <button onClick={sendMessage} disabled={isLoading || !inputValue.trim()} className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold self-end">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- FIX 4: Adding styles for markdown content --- */}
      <style>{`
          .markdown-content ul {
              list-style-type: disc;
              padding-left: 20px;
              margin-top: 8px;
          }
          .markdown-content li {
              margin-bottom: 4px;
          }
           .markdown-content p {
              margin-bottom: 8px;
          }
           .markdown-content p:last-child {
              margin-bottom: 0;
          }
          .chat-container::-webkit-scrollbar {
              width: 6px;
          }
          .chat-container::-webkit-scrollbar-thumb {
              background-color: #f59e0b;
              border-radius: 10px;
          }
          .chat-container::-webkit-scrollbar-track {
              background-color: #f1f5f9;
          }
      `}</style>
    </div>
  );
};

export default LexChatbot;